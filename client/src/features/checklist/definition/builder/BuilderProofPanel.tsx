import type { ChecklistProofType } from '../../../../api/checklistDefinitions';

const PROOF_OPTIONS: { value: ChecklistProofType; label: string }[] = [
  { value: 'PHOTO', label: 'Photo' },
  { value: 'GPS_MATCH', label: 'GPS match' },
  { value: 'TIMESTAMP', label: 'Timestamp' },
  { value: 'SIGNATURE', label: 'Signature' },
  { value: 'QR_SCAN', label: 'QR scan' },
];

interface BuilderProofPanelProps {
  selected: ChecklistProofType[];
  onChange: (proof: ChecklistProofType[]) => void;
}

// Descriptive rollup of the proof types this checklist expects across its items — the real
// per-item enforcement already happens via each item's own requiredImageCount/gpsTarget*/
// signatureLabels/qrExpectedValue (see ChecklistDefinitionItem), checked by
// checklistInstance.service.ts's setItemDone regardless of what's toggled here.
export const BuilderProofPanel = ({ selected, onChange }: BuilderProofPanelProps) => {
  const toggle = (value: ChecklistProofType) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-surface">
      <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Proof Required</h2>
      <div className="flex flex-wrap gap-1.5">
        {PROOF_OPTIONS.map(opt => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-colors cursor-pointer',
                checked
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'border border-border text-text-secondary hover:bg-surface-hover',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] font-display text-text-muted leading-relaxed">
        Completion is blocked until every required photo, mandatory field and GPS match on the items
        below is captured — the toggles above are a summary of what this checklist expects, not a
        separate rule.
      </p>
    </div>
  );
};
