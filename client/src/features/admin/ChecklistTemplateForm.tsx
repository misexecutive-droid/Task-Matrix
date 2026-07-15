import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateChecklistTemplateMutation } from './hooks';
import type { ChecklistTemplateTarget } from '../../api/checklistTemplates';

interface ChecklistTemplateFormProps {
  onClose: () => void;
}

type ItemDraft = {
  label:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
};

const emptyItemDraft = (): ItemDraft => ({
  label: '', requiredImageCount: '0', maxImageCount: '', requiresLivePhoto: false,
});

// Creating a template: name + which system it applies to, plus an optional starting set of
// items — same idea as TaskChecklistPanel/ChecklistPanel's "Add checklist" form, just saved as
// a reusable definition instead of a real checklist on one task/ticket. Editing a template's
// items afterwards happens inline in ChecklistTemplateList, not through this form.
export const ChecklistTemplateForm = ({ onClose }: ChecklistTemplateFormProps) => {
  const [name, setName] = useState('');
  const [appliesTo, setAppliesTo] = useState<ChecklistTemplateTarget>('TASK');
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);
  const [nameError, setNameError] = useState<string | null>(null);

  const createMutation = useCreateChecklistTemplateMutation();

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Template name is required');
      return;
    }
    const items = itemDrafts
      .filter(d => d.label.trim())
      .map((d, index) => ({
        label:              d.label.trim(),
        order:              index,
        requiredImageCount: Number(d.requiredImageCount) || 0,
        maxImageCount:      d.maxImageCount ? Number(d.maxImageCount) : undefined,
        requiresLivePhoto:  d.requiresLivePhoto,
      }));

    createMutation.mutate(
      { name: name.trim(), appliesTo, items: items.length ? items : undefined },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New checklist template</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            id="name"
            label="Template name"
            placeholder="e.g. Daily Store Opening"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(null); }}
            error={nameError ?? undefined}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="appliesTo" className="text-sm font-display font-medium text-text-secondary">
              Applies to
            </label>
            <select
              id="appliesTo"
              value={appliesTo}
              onChange={e => setAppliesTo(e.target.value as ChecklistTemplateTarget)}
              className="w-full px-3 h-11 sm:h-10 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 transition-colors cursor-pointer"
            >
              <option value="TASK">Tasks</option>
              <option value="TICKET">Tickets</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-display font-medium text-text-secondary">
              Items <span className="text-text-light">(optional — can add more later)</span>
            </p>
            {itemDrafts.map((draft, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-2 bg-surface-hover rounded-md border border-border">
                <div className="flex items-center gap-1.5">
                  <input
                    value={draft.label}
                    onChange={e => updateDraft(i, { label: e.target.value })}
                    placeholder={`Item ${i + 1} label…`}
                    className="flex-1 px-2 py-1.5 text-xs bg-surface text-text rounded border border-border focus:outline-none focus:border-primary-500 placeholder:text-text-muted"
                  />
                  {itemDrafts.length > 1 && (
                    <button
                      onClick={() => setItemDrafts(d => d.filter((_, idx) => idx !== i))}
                      className="shrink-0 text-text-light hover:text-danger transition-colors cursor-pointer"
                      aria-label="Remove item"
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={draft.requiredImageCount}
                    onChange={e => updateDraft(i, { requiredImageCount: e.target.value })}
                    className="w-16 px-2 py-1 text-xs bg-surface text-text rounded border border-border"
                    title="Required photo count"
                  />
                  <input
                    type="number"
                    min={0}
                    value={draft.maxImageCount}
                    onChange={e => updateDraft(i, { maxImageCount: e.target.value })}
                    placeholder="Max"
                    className="w-16 px-2 py-1 text-xs bg-surface text-text rounded border border-border placeholder:text-text-light"
                    title="Maximum photo count"
                  />
                  <label className="flex items-center gap-1 text-xs text-text-secondary px-1">
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

            <button
              type="button"
              onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
              className="flex items-center gap-1 text-xs font-display text-primary-600 hover:text-primary-700 cursor-pointer w-fit"
            >
              <Plus size={12} />
              Add another item
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-danger text-center">
              {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create template.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" size="sm" isLoading={createMutation.isPending} onClick={handleSubmit}>
            Create template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};