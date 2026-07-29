import { LABEL_CLASS, PRIORITIES, type TicketPriority } from './formConstants';

interface PriorityFieldProps {
  value: TicketPriority;
  onChange: (value: TicketPriority) => void;
}

export const PriorityField = ({ value, onChange }: PriorityFieldProps) => (
  <div className="flex flex-col gap-2">
    <label className={LABEL_CLASS}>Priority Level</label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
      {PRIORITIES.map((p) => {
        const isSelected = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`px-2 py-3 sm:py-2.5 text-xs font-display font-medium rounded-md border transition-all duration-200 text-center ${isSelected
                ? p.activeClass
                : 'border-border/60 bg-surface/50 text-text-muted hover:bg-surface/80 hover:text-text'
              }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  </div>
);
