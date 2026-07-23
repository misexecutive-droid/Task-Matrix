import { useState } from 'react';
import {
  Plus, Trash2, Loader2, CheckSquare, Square, ChevronDown, ChevronRight,
  Camera, X, RotateCcw, Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components';
import {
  useDeleteTaskChecklistMutation,
  useUpdateTaskChecklistItemMutation,
  useUpdateTaskItemRemarksMutation,
  useCompleteTaskChecklistItemMutation,
  useDeleteTaskChecklistItemMutation,
  useUploadTaskImagesMutation,
  useDeleteTaskImageMutation,
} from './hook';
import type { TaskChecklist, TaskChecklistItem, CaptureMethod } from '../../api/taskChecklist';
import { NewChecklistForm } from './NewChecklistForm';

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
  canWork:  boolean;
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

  const photosSatisfied = item.requiredImageCount > 0 && qualifying >= item.requiredImageCount;

  return (
    <div 
      className={`group/card flex flex-col gap-4 p-4 rounded-xl border bg-surface transition-all duration-200 ${
        item.isDone ? 'border-border/50 opacity-75 grayscale-[20%]' : 'border-border shadow-sm hover:shadow-md'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex items-center justify-center size-8 rounded-lg shrink-0 transition-colors ${
            item.isDone ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface-hover text-text-light border border-border'
          }`}
        >
          {item.isDone ? <CheckSquare size={16} /> : <Square size={16} />}
        </span>

        <div className="flex-1 min-w-0">
          <p className={`text-base font-mono font-medium leading-tight ${item.isDone ? 'line-through text-text-muted' : 'text-text'}`}>
            {item.label}
          </p>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-text-muted font-medium bg-surface-hover px-2 py-0.5 rounded-md">
              {item.isDone && item.completedAt
                ? `Completed ${new Date(item.completedAt).toLocaleDateString()}`
                : item.dueAt
                  ? `Due ${new Date(item.dueAt).toLocaleDateString()}`
                  : 'No due date'}
            </span>
            
            {item.requiredImageCount > 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                photosSatisfied ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
              }`}>
                <Camera size={12} />
                {qualifying}/{item.requiredImageCount} {item.requiresLivePhoto ? 'Live' : 'Photos'}
              </span>
            )}
          </div>
        </div>

        {/* Admin Actions - Appear on hover for cleaner UI */}
        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          {isAdmin && item.isDone && (
            <button
              onClick={() => updateItem.mutate({ id: item.id, payload: { isDone: false } })}
              disabled={updateItem.isPending}
              className="p-1.5 text-text-light hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Reopen"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => deleteItem.mutate(item.id)}
              disabled={deleteItem.isPending}
              className="p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Delete item"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Hero image strip */}
      {item.images.length > 0 && (
        <div className="flex flex-wrap gap-3 pl-11">
          {item.images.map(img => (
            <div key={img.id} className="relative group/img overflow-hidden rounded-lg border border-border shadow-sm">
              <img
                src={`${UPLOADS_BASE}${img.url}`}
                alt={img.originalFilename ?? 'evidence'}
                className="size-20 object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
              
              <span className={`absolute top-1 left-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shadow-sm text-white backdrop-blur-md ${
                img.captureMethod === 'LIVE' ? 'bg-emerald-500/90' : 'bg-gray-800/90'
              }`}>
                {img.captureMethod === 'LIVE' ? 'Live' : 'Gallery'}
              </span>
              
              {canWork && (
                <button
                  onClick={() => deleteImage.mutate(img.id)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all hover:bg-red-600 hover:scale-110 cursor-pointer shadow-sm"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Body & Actions */}
      <div className="pl-11 flex flex-col gap-3">
        {(!canWork || item.isDone) && item.remarks && (
          <div className="px-3 py-2 bg-surface-hover rounded-lg border border-border/50 text-sm text-text-secondary italic">
            "{item.remarks}"
          </div>
        )}

        {canWork && !item.isDone && (
          <div className="flex flex-col gap-3">
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Add remarks or notes..."
              rows={2}
              className="w-full px-3 py-2 text-sm bg-surface text-text rounded-lg border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-text-light resize-none transition-all"
            />

            {(uploadImages.isError || completeItem.isError) && (
              <p className="text-xs text-danger font-medium px-2 py-1 bg-danger/10 rounded-md">
                {uploadImages.error?.message || completeItem.error?.message || 'An error occurred.'}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-primary-500/30 text-primary-600 bg-primary-500/5 hover:bg-primary-500/15 cursor-pointer transition-colors shadow-sm">
                <Camera size={14} />
                Take Photo
                <input
                  type="file" accept="image/*" capture="environment" multiple
                  className="hidden" onChange={e => { handleFiles(e.target.files, 'LIVE'); e.target.value = ''; }}
                />
              </label>
              
              <label className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-border text-text-secondary bg-surface hover:bg-surface-hover cursor-pointer transition-colors shadow-sm">
                <ImageIcon size={14} />
                Gallery
                <input
                  type="file" accept="image/*" multiple
                  className="hidden" onChange={e => { handleFiles(e.target.files, 'GALLERY'); e.target.value = ''; }}
                />
              </label>

              {uploadImages.isPending && <Loader2 size={16} className="animate-spin text-primary-500 ml-2" />}

              <div className="flex-1" /> {/* Spacer */}

              <button
                onClick={() => updateRemarks.mutate({ id: item.id, remarks })}
                disabled={updateRemarks.isPending || !remarks.trim()}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover cursor-pointer transition-colors disabled:opacity-50"
              >
                {updateRemarks.isPending && <Loader2 size={14} className="animate-spin" />}
                Save Notes
              </button>

              <button
                onClick={() => completeItem.mutate(item.id)}
                disabled={completeItem.isPending}
                className="flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer transition-all disabled:opacity-50 shadow-sm hover:shadow active:scale-95"
              >
                {completeItem.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                Complete
              </button>
            </div>
          </div>
        )}
      </div>
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
  const progress = checklist.items.length ? (doneCount / checklist.items.length) * 100 : 0;

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      <div 
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-surface-hover ${open ? 'border-b border-border/50' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-1 rounded bg-surface-hover border border-border text-text-muted">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-mono font-semibold text-text truncate">
              {checklist.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 max-w-[200px]">
              <div className="h-1.5 flex-1 bg-surface-hover rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted font-medium w-8">
                {doneCount}/{checklist.items.length}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteChecklist.mutate(checklist.id); }}
            disabled={deleteChecklist.isPending}
            className="p-2 text-text-light hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ml-2"
          >
            {deleteChecklist.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        )}
      </div>

      <div className={`transition-all duration-300 ease-in-out ${open ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        <div className="flex flex-col gap-3 p-3 bg-surface-hover/30">
          {checklist.items.length === 0 && (
            <div className="p-6 text-center text-sm text-text-muted bg-surface rounded-lg border border-dashed border-border">
              No items in this checklist yet.
            </div>
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
      </div>
    </div>
  );
};

export const TaskChecklistPanel = ({ taskId, checklists, isAdmin, currentUserId }: TaskChecklistPanelProps) => {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border/50">
        <h3 className="text-lg font-mono font-semibold text-text">Checklists</h3>
        {isAdmin && !adding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAdding(true)}
            className="gap-2"
          >
            <Plus size={16} />
            New Checklist
          </Button>
        )}
      </div>

      {adding && (
        <NewChecklistForm taskId={taskId} onDone={() => setAdding(false)} />
      )}

      {checklists.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center p-10 text-center bg-surface rounded-xl border border-dashed border-border">
          <CheckSquare size={32} className="text-text-muted mb-3 opacity-50" />
          <h4 className="text-sm font-medium text-text">No Checklists</h4>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Break down this task into smaller, trackable items. Add a checklist to get started.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
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
    </div>
  );
};