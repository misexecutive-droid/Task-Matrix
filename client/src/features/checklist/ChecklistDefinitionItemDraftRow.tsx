export type ItemDraft = {
  label: string;
};

export const emptyItemDraft = (): ItemDraft => ({ label: '' });

interface ChecklistDefinitionItemDraftRowProps {
  index:    number;
  draft:    ItemDraft;
  onChange: (index: number, patch: Partial<ItemDraft>) => void;
}

// Trimmed sibling of tasks/ItemDraftRow.tsx — this feature's items are just a label (assignment
// lives at the checklist level via assigneeIds, not per-item).
export const ChecklistDefinitionItemDraftRow = ({ index, draft, onChange }: ChecklistDefinitionItemDraftRowProps) => (
  <input
    value={draft.label}
    onChange={e => onChange(index, { label: e.target.value })}
    placeholder={`Item ${index + 1} description...`}
    className="w-full px-3 py-2 text-sm bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
  />
);
