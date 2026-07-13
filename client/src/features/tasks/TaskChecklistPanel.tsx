import { useState } from 'react';
import {
  Plus, Trash2, Loader2, CheckSquare, Square, ChevronDown, ChevronRight,
  Camera, ImageUp, X, RotateCcw,
} from 'lucide-react';
import { Button } from '../../components';
import {
  useAddTaskChecklistMutation,
  useDeleteTaskChecklistMutation,
  useUpdateTaskChecklistItemMutation,
  useUpdateTaskItemRemarksMutation,
  useCompleteTaskChecklistItemMutation,
  useDeleteTaskChecklistItemMutation,
  useUploadTaskImagesMutation,
  useDeleteTaskImageMutation,
  useAssignableUsersQuery,
} from './hook';
import type { TaskChecklist, TaskChecklistItem, CaptureMethod } from '../../api/taskChecklist';

const UPLOADS_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

interface TaskChecklistPanelProps {
  taskId:         string;
  checklists:     TaskChecklist[];
  isAdmin:        boolean;
  currentUserId?: string;
}

const ItemRow = ({
  item, taskId, isAdmin, canWork,
}: {
  item:     TaskChecklistItem;
  taskId:   string;
  isAdmin:  boolean;
  canWork:  boolean; // assignee or admin — allowed to upload/complete/remark
}) => {
  const [remarks, setRemarks] = useState(item.remarks ?? '');

  const updateItem    = useUpdateTaskChecklistItemMutation(taskId);
  const updateRemarks = useUpdateTaskItemRemarksMutation(taskId);
  const completeItem  = useCompleteTaskChecklistItemMutation(taskId);
  const deleteItem    = useDeleteTaskChecklistItemMutation(taskId);
  const uploadImages  = useUploadTaskImagesMutation(taskId);
  const deleteImage   = useDeleteTaskImageMutation(taskId);

  const qualifying = item.requiresLivePhoto
    ? item.images.filter(i => i.captureMethod === 'LIVE').length
    : item.images.length;

  const handleFiles = (files: FileList | null, captureMethod: CaptureMethod) => {
    if (!files || !files.length) return;
    uploadImages.mutate({ itemId: item.id, files: Array.from(files), captureMethod });
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-3 border-t border-slate-100 first:border-t-0">
      <div className="flex items-start gap-2.5">
        {item.isDone
          ? <CheckSquare size={16} className="text-primary-600 shrink-0 mt-0.5" />
          : <Square size={16} className="text-slate-300 shrink-0 mt-0.5" />}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-display ${item.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
            {item.label}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {item.dueAt && (
              <span className="text-xs text-slate-400 font-display">
                Due {new Date(item.dueAt).toLocaleDateString()}
              </span>
            )}
            {item.requiredImageCount > 0 && (
              <span className={[
                'text-xs font-display px-1.5 py-0.5 rounded-full',
                qualifying >= item.requiredImageCount ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
              ].join(' ')}>
                {qualifying}/{item.requiredImageCount} photo{item.requiredImageCount !== 1 ? 's' : ''}
                {item.requiresLivePhoto ? ' (live)' : ''}
              </span>
            )}
            {item.isDone && item.completedAt && (
              <span className="text-xs text-emerald-600 font-display">
                Completed {new Date(item.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isAdmin && item.isDone && (
          <button
            onClick={() => updateItem.mutate({ id: item.id, payload: { isDone: false } })}
            disabled={updateItem.isPending}
            className="shrink-0 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Reopen item"
            title="Reopen"
          >
            <RotateCcw size={14} />
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => deleteItem.mutate(item.id)}
            disabled={deleteItem.isPending}
            className="shrink-0 text-slate-200 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Delete item"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {item.images.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-[26px]">
          {item.images.map(img => (
            <div key={img.id} className="relative group/img">
              <img
                src={`${UPLOADS_BASE}${img.url}`}
                alt={img.originalFilename ?? 'evidence'}
                className="size-14 object-cover rounded-md border border-slate-200"
              />
              <span className={[
                'absolute -top-1 -left-1 text-[9px] font-display px-1 rounded-full text-white',
                img.captureMethod === 'LIVE' ? 'bg-emerald-500' : 'bg-slate-400',
              ].join(' ')}>
                {img.captureMethod === 'LIVE' ? 'Live' : 'Gallery'}
              </span>
              {canWork && (
                <button
                  onClick={() => deleteImage.mutate(img.id)}
                  className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Delete image"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canWork && !item.isDone && (
        <div className="flex flex-col gap-2 pl-[26px]">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs font-display text-primary-600 hover:text-primary-700 cursor-pointer">
              <Camera size={13} />
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={e => { handleFiles(e.target.files, 'LIVE'); e.target.value = ''; }}
              />
            </label>
            <label className="flex items-center gap-1 text-xs font-display text-slate-500 hover:text-slate-700 cursor-pointer">
              <ImageUp size={13} />
              Choose from gallery
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { handleFiles(e.target.files, 'GALLERY'); e.target.value = ''; }}
              />
            </label>
            {uploadImages.isPending && <Loader2 size={13} className="animate-spin text-slate-400" />}
          </div>

          {uploadImages.isError && (
            <p className="text-xs text-red-500">
              {uploadImages.error instanceof Error ? uploadImages.error.message : 'Upload failed.'}
            </p>
          )}

          <div className="flex gap-2">
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Remarks about this item…"
              rows={2}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:border-primary-500 placeholder:text-slate-400 resize-none"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateRemarks.mutate({ id: item.id, remarks })}
              isLoading={updateRemarks.isPending}
            >
              Save
            </Button>
          </div>

          <div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => completeItem.mutate(item.id)}
              isLoading={completeItem.isPending}
            >
              Mark complete
            </Button>
            {completeItem.isError && (
              <p className="text-xs text-red-500 mt-1">
                {completeItem.error instanceof Error ? completeItem.error.message : 'Could not complete item.'}
              </p>
            )}
          </div>
        </div>
      )}

      {(!canWork || item.isDone) && item.remarks && (
        <p className="text-xs text-slate-500 font-display pl-[26px] italic">"{item.remarks}"</p>
      )}
    </div>
  );
};

const ChecklistBlock = ({
  checklist, taskId, isAdmin, currentUserId,
}: {
  checklist:      TaskChecklist;
  taskId:         string;
  isAdmin:        boolean;
  currentUserId?: string;
}) => {
  const [open, setOpen] = useState(true);
  const deleteChecklist = useDeleteTaskChecklistMutation(taskId);
  const doneCount = checklist.items.filter(i => i.isDone).length;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          {open
            ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
            : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
          <span className="text-sm font-display font-medium text-slate-700 truncate">
            {checklist.title}
          </span>
          <span className="text-xs text-slate-400 font-display shrink-0 ml-1">
            {doneCount}/{checklist.items.length}
          </span>
        </button>

        {isAdmin && (
          <button
            onClick={() => deleteChecklist.mutate(checklist.id)}
            disabled={deleteChecklist.isPending}
            className="text-slate-300 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 ml-2"
            aria-label="Delete checklist"
          >
            {deleteChecklist.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : <Trash2 size={13} />}
          </button>
        )}
      </div>

      {open && (
        <div>
          {checklist.items.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-slate-400 font-display">No items yet.</p>
          )}
          {checklist.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              taskId={taskId}
              isAdmin={isAdmin}
              canWork={isAdmin || (!!currentUserId && item.assigneeId === currentUserId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

type ItemDraft = {
  label:              string;
  assigneeId:         string;
  dueAt:              string;
  requiredImageCount: string;
  requiresLivePhoto:  boolean;
};

const emptyItemDraft = (): ItemDraft => ({
  label: '', assigneeId: '', dueAt: '', requiredImageCount: '0', requiresLivePhoto: false,
});

export const TaskChecklistPanel = ({ taskId, checklists, isAdmin, currentUserId }: TaskChecklistPanelProps) => {
  const [adding, setAdding]         = useState(false);
  const [title, setTitle]          = useState('');
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);

  const { data: assignableUsers } = useAssignableUsersQuery();
  const addChecklist = useAddTaskChecklistMutation(taskId);

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const resetForm = () => {
    setTitle('');
    setItemDrafts([emptyItemDraft()]);
    setAdding(false);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const items = itemDrafts
      .filter(d => d.label.trim())
      .map(d => ({
        label:              d.label.trim(),
        assigneeId:         d.assigneeId || undefined,
        dueAt:              d.dueAt ? new Date(d.dueAt).toISOString() : undefined,
        requiredImageCount: Number(d.requiredImageCount) || 0,
        requiresLivePhoto:  d.requiresLivePhoto,
      }));
    addChecklist.mutate(
      { title: title.trim(), items: items.length ? items : undefined },
      { onSuccess: resetForm },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-slate-700">Checklists</h3>
        {isAdmin && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-display text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Add checklist
          </button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Checklist title…"
            className="px-3 py-2 text-sm bg-white rounded-md border border-slate-300 focus:outline-none focus:border-primary-500 placeholder:text-slate-400"
          />

          <div className="flex flex-col gap-2">
            {itemDrafts.map((draft, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-2 bg-white rounded-md border border-slate-200">
                <input
                  value={draft.label}
                  onChange={e => updateDraft(i, { label: e.target.value })}
                  placeholder={`Item ${i + 1} label…`}
                  className="px-2 py-1.5 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-primary-500 placeholder:text-slate-400"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <select
                    value={draft.assigneeId}
                    onChange={e => updateDraft(i, { assigneeId: e.target.value })}
                    className="px-2 py-1 text-xs bg-white rounded border border-slate-300 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers?.map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={draft.dueAt}
                    onChange={e => updateDraft(i, { dueAt: e.target.value })}
                    className="px-2 py-1 text-xs bg-white rounded border border-slate-300"
                  />
                  <input
                    type="number"
                    min={0}
                    value={draft.requiredImageCount}
                    onChange={e => updateDraft(i, { requiredImageCount: e.target.value })}
                    className="w-16 px-2 py-1 text-xs bg-white rounded border border-slate-300"
                    title="Required photo count"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500 px-1">
                    <input
                      type="checkbox"
                      checked={draft.requiresLivePhoto}
                      onChange={e => updateDraft(i, { requiresLivePhoto: e.target.checked })}
                    />
                    Live photo only
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
            className="flex items-center gap-1 text-xs font-display text-primary-600 hover:text-primary-700 cursor-pointer w-fit"
          >
            <Plus size={12} />
            Add another item
          </button>

          {addChecklist.isError && (
            <p className="text-xs text-red-500">
              {addChecklist.error instanceof Error ? addChecklist.error.message : 'Failed to create checklist.'}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleAdd} isLoading={addChecklist.isPending}>
              Create
            </Button>
          </div>
        </div>
      )}

      {checklists.length === 0 && !adding && (
        <p className="text-xs text-slate-400 font-display py-2">No checklists yet.</p>
      )}

      {checklists.map(cl => (
        <ChecklistBlock
          key={cl.id}
          checklist={cl}
          taskId={taskId}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};
