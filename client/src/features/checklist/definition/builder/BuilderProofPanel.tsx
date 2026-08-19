import { Camera, MapPin, Clock, PenLine, ScanLine, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChecklistProofType } from '../../../../api/checklistDefinitions';

// Tightly coupled to BuilderProofPanel right below — only affects Fast Refresh granularity,
// not runtime correctness.
// eslint-disable-next-line react-refresh/only-export-components
export const PROOF_OPTIONS: { value: ChecklistProofType; label: string; icon: LucideIcon }[] = [
  { value: 'PHOTO', label: 'Photo', icon: Camera },
  { value: 'GPS_MATCH', label: 'GPS match', icon: MapPin },
  { value: 'TIMESTAMP', label: 'Timestamp', icon: Clock },
  { value: 'SIGNATURE', label: 'Signature', icon: PenLine },
  { value: 'QR_SCAN', label: 'QR scan', icon: ScanLine },
];
interface BuilderProofPanelProps {
  selected: ChecklistProofType[];
  onChange: (proof: ChecklistProofType[]) => void;
}

export const BuilderProofPanel = ({ selected, onChange }: BuilderProofPanelProps) => {
  const toggle = (value: ChecklistProofType) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-surface shadow-xs hover:shadow-sm transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Proof Required</h2>
        <Badge variant="outline">{selected.length} selected</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {PROOF_OPTIONS.map(opt => {
          const checked = selected.includes(opt.value);
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={checked}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-display font-semibold transition-all duration-200 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                checked
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:border-border-hover',
              ].join(' ')}
            >
              <Icon size={13} className={checked ? 'text-white' : 'text-text-muted'} />
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="flex items-start gap-2 text-[11px] font-display text-coral-700 leading-relaxed bg-coral-500/10 border border-coral-500/20 p-3 rounded-lg">
        <span className="mt-1 size-1.5 rounded-full bg-coral-500 shrink-0" />
        Completion is blocked until every required photo, mandatory field and GPS match on the items below is captured.
      </p>
    </div>
  );
};
