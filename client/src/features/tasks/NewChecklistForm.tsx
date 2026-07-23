import { useState } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { Button } from '../../components';
import {
  useAddTaskChecklistMutation,
  useAssignableUsersQuery,
  useChecklistTemplatesQuery,
  useApplyChecklistTemplateMutation,
} from './hook';

type ItemDraft = {
  label:              string;
  assigneeId:         string;
  dueAt:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
};

const emptyItemDraft = (): ItemDraft => ({
  label: '', assigneeId: '', dueAt: '', requiredImageCount: '0', maxImageCount: '', requiresLivePhoto: false,
});

interface NewChecklistFormProps {
  taskId: string;
  onDone: () => void;
}

export const NewChecklistForm = ({ taskId, onDone }: NewChecklistFormProps) => {
  const [title, setTitle]          = useState('');
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);
  const [templateId, setTemplateId] = useState('');

  const { data: assignableUsers } = useAssignableUsersQuery();
  const { data: templates } = useChecklistTemplatesQuery();
  const addChecklist = useAddTaskChecklistMutation(taskId);
  const applyTemplate = useApplyChecklistTemplateMutation(taskId);

  const handleApplyTemplate = () => {
    if (!templateId) return;
    applyTemplate.mutate(templateId, { onSuccess: () => setTemplateId('') });
  };

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleAdd = () => {
    if (!title.trim()) return;
    const items = itemDrafts
      .filter(d => d.label.trim())
      .map(d => ({
        label:              d.label.trim(),
        assigneeId:         d.assigneeId || undefined,
        dueAt:              d.dueAt ? new Date(d.dueAt).toISOString() : undefined,
        requiredImageCount: Number(d.requiredImageCount) || 0,
        maxImageCount:      d.maxImageCount ? Number(d.maxImageCount) : undefined,
        requiresLivePhoto:  d.requiresLivePhoto,
      }));
    addChecklist.mutate(
      { title: title.trim(), items: items.length ? items : undefined },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="flex flex-col gap-4 p-5 border border-border rounded-xl bg-surface shadow-md">
      {!!templates?.length && (
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-border/50">
          <span className="text-sm font-medium text-text-secondary">Or apply a template</span>
          <div className="flex items-center gap-2 bg-surface-hover p-1 rounded-lg border border-border">
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="px-2 py-1 text-sm bg-transparent text-text cursor-pointer focus:outline-none"
            >
              <option value="">Apply template…</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              onClick={handleApplyTemplate}
              disabled={!templateId}
              isLoading={applyTemplate.isPending}
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {applyTemplate.isError && (
        <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm border border-danger/20">
          {applyTemplate.error instanceof Error ? applyTemplate.error.message : 'Failed to apply template.'}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1">Checklist Title</label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Pre-flight Inspection"
          className="w-full px-4 py-2.5 text-base bg-surface text-text rounded-lg border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <h4 className="text-sm font-medium text-text-secondary">Tasks ({itemDrafts.length})</h4>
        {itemDrafts.map((draft, i) => (
          <div key={i} className="flex flex-col gap-3 p-4 bg-surface-hover/50 rounded-lg border border-border">
            <input
              value={draft.label}
              onChange={e => updateDraft(i, { label: e.target.value })}
              placeholder={`Task ${i + 1} description...`}
              className="w-full px-3 py-2 text-sm bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-muted">Assignee</label>
                <select
                  value={draft.assigneeId}
                  onChange={e => updateDraft(i, { assigneeId: e.target.value })}
                  className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border"
                >
                  <option value="">Unassigned</option>
                  {assignableUsers?.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-muted">Due Date</label>
                <input
                  type="date"
                  value={draft.dueAt}
                  onChange={e => updateDraft(i, { dueAt: e.target.value })}
                  className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-muted">Min Photos</label>
                <input
                  type="number" min={0}
                  value={draft.requiredImageCount}
                  onChange={e => updateDraft(i, { requiredImageCount: e.target.value })}
                  className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-muted">Max Photos</label>
                <input
                  type="number" min={0}
                  value={draft.maxImageCount}
                  onChange={e => updateDraft(i, { maxImageCount: e.target.value })}
                  placeholder="Optional"
                  className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border placeholder:text-text-light"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text transition-colors">
                <div className={`flex items-center justify-center size-4 rounded border ${draft.requiresLivePhoto ? 'bg-primary-500 border-primary-500' : 'bg-surface border-border'}`}>
                   {draft.requiresLivePhoto && <CheckSquare size={12} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={draft.requiresLivePhoto}
                  onChange={e => updateDraft(i, { requiresLivePhoto: e.target.checked })}
                />
                Requires live camera capture
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
        className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary-600 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 rounded-lg border-dashed transition-colors w-full"
      >
        <Plus size={16} />
        Add Another Task
      </button>

      {addChecklist.isError && (
        <p className="p-3 bg-danger/10 text-danger rounded-lg text-sm border border-danger/20">
          {addChecklist.error instanceof Error ? addChecklist.error.message : 'Failed to create checklist.'}
        </p>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-border mt-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} isLoading={addChecklist.isPending}>
          Create Checklist
        </Button>
      </div>
    </div>
  );
};
