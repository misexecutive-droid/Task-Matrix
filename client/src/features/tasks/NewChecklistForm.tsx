import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components';
import {
  useAddTaskChecklistMutation,
  useAssignableUsersQuery,
  useChecklistTemplatesQuery,
  useApplyChecklistTemplateMutation,
} from './hook';
import { ItemDraftRow, emptyItemDraft, type ItemDraft } from './ItemDraftRow';

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
          <span className="text-sm font-mono font-medium text-text-secondary">Or apply a template</span>
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
        <label className="block text-sm font-mono font-medium text-text mb-1">Checklist Title</label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Pre-flight Inspection"
          className="w-full px-4 py-2.5 text-base bg-surface text-text rounded-lg border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <h4 className="text-sm font-mono font-medium text-text-secondary">Tasks ({itemDrafts.length})</h4>
        {itemDrafts.map((draft, i) => (
          <ItemDraftRow
            key={i}
            index={i}
            draft={draft}
            assignableUsers={assignableUsers}
            onChange={updateDraft}
          />
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
