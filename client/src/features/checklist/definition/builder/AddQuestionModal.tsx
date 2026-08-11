import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Modal } from '../../../../components';
import { ItemTypeConfigFields, isItemDraftComplete } from './ItemTypeConfigFields';
import { emptyItemDraft, type ItemDraft } from '../ChecklistDefinitionItemDraftRow';
import type { PaletteEntry } from './QuestionTypePalette';

interface AddQuestionModalProps {
  entry:      PaletteEntry;
  storeId?:   string;
  onClose:    () => void;
  onConfirm:  (patch: Partial<ItemDraft>) => void;
}

// Fires when a Question Type is clicked in the palette — collects the label plus whatever that
// type actually needs (via the same ItemTypeConfigFields the full item row uses) so the item
// that lands in "Checklist Items" below is ready to go, not a blank row the admin has to hunt
// through the type tab-strip to configure.
export const AddQuestionModal = ({ entry, storeId, onClose, onConfirm }: AddQuestionModalProps) => {
  const [draft, setDraft] = useState<ItemDraft>(() => ({ ...emptyItemDraft(), ...entry.patch, label: '' }));
  const Icon = entry.icon;

  const patchDraft = (patch: Partial<ItemDraft>) => setDraft(d => ({ ...d, ...patch }));

  const canConfirm = !!draft.label.trim() && isItemDraftComplete(draft);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(draft);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={entry.label}
      description="Set this up once — you can still fine-tune it in the list afterwards."
      icon={<Icon size={17} />}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-display font-semibold text-text-secondary border border-border bg-surface hover:bg-surface-hover transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold text-white bg-primary-700 shadow-sm transition-all duration-150 hover:bg-primary-800 hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <Sparkles size={14} />
            Add to checklist
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="quick-add-label" className="text-xs font-display font-semibold text-text-secondary">
          What should the store team see?
        </label>
        <input
          id="quick-add-label"
          autoFocus
          value={draft.label}
          onChange={e => patchDraft({ label: e.target.value })}
          placeholder="e.g. Count cash drawer before closing"
          className="w-full px-3 py-2.5 text-sm font-display bg-surface text-text rounded-lg border border-border placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-150"
        />
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-dashed border-border/60">
        <ItemTypeConfigFields draft={draft} onChange={patchDraft} storeId={storeId} />
      </div>
    </Modal>
  );
};
