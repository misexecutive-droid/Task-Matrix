import { Plus } from 'lucide-react';
import { ChecklistDefinitionItemDraftRow, type ItemDraft } from '../ChecklistDefinitionItemDraftRow';
import { LABEL_CLASS } from './formConstants';

interface ChecklistItemsEditorProps {
  itemDrafts:    ItemDraft[];
  onUpdateDraft: (index: number, patch: Partial<ItemDraft>) => void;
  onAddDraft:    () => void;
  departmentId?: string;
}

export const ChecklistItemsEditor = ({ itemDrafts, onUpdateDraft, onAddDraft, departmentId }: ChecklistItemsEditorProps) => (
  <div className="space-y-3 pt-2">
    <div className="flex items-center justify-between">
      <label className={LABEL_CLASS}>
        Checklist Items
        <span className="ml-2 flex items-center justify-center size-5 rounded-full bg-surface-dark border border-border/50 text-[10px] text-text-muted">
          {itemDrafts.length}
        </span>
      </label>
    </div>

    <div className="flex flex-col gap-2.5">
      {itemDrafts.map((draft, i) => (
        <ChecklistDefinitionItemDraftRow
          key={i}
          index={i}
          draft={draft}
          onChange={onUpdateDraft}
          departmentId={departmentId}
        />
      ))}
    </div>

    <button
      type="button"
      onClick={onAddDraft}
      className="flex items-center justify-center gap-2 h-10 w-full text-sm font-display font-medium text-primary-600 dark:text-primary-400 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 rounded-lg border-dashed transition-all active:scale-[0.98]"
    >
      <Plus size={16} />
      Add Another Item
    </button>
  </div>
);
