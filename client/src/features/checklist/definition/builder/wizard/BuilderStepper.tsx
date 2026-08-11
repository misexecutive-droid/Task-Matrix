import { Check, AlertTriangle } from 'lucide-react';

interface BuilderStepperProps {
  steps: readonly { label: string }[];
  current: number;
  maxReached: number;
  allUnlocked: boolean;
  isStepValid: (index: number) => boolean;
  onSelect: (index: number) => void;
}

// Linear-but-forgiving wizard nav: steps beyond `maxReached` are genuinely disabled (not just
// dimmed) in create mode, but never re-lock once reached, even if an earlier step regresses — see
// BuilderReviewStep for how regressions actually get surfaced. `allUnlocked` (edit mode) skips the
// lock check entirely so every section is one click away for an admin who already has valid data.
export const BuilderStepper = ({ steps, current, maxReached, allUnlocked, isStepValid, onSelect }: BuilderStepperProps) => (
  <nav aria-label="Checklist builder steps" className="w-full overflow-x-auto">
    <ol className="flex items-center min-w-max sm:min-w-0">
      {steps.map((s, i) => {
        const locked = i > maxReached && !allUnlocked;
        const isCurrent = i === current;
        const valid = isStepValid(i);
        const connectorFilled = i < current;
        const isLast = i === steps.length - 1;

        return (
          <li key={s.label} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => !locked && onSelect(i)}
              disabled={locked}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={locked ? `${s.label} (complete previous steps first)` : s.label}
              className="group flex items-center gap-2.5 shrink-0 cursor-pointer disabled:cursor-not-allowed focus:outline-none"
            >
              <span
                className={[
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-display font-bold transition-all duration-200',
                  locked && 'bg-surface-hover text-text-light border border-border',
                  !locked && isCurrent && 'bg-primary-700 text-white ring-4 ring-primary-500/20',
                  !locked && !isCurrent && valid && 'bg-primary-700 text-white',
                  !locked && !isCurrent && !valid && 'bg-warning/10 text-warning border-2 border-warning/40',
                ].filter(Boolean).join(' ')}
              >
                {!locked && !isCurrent && valid && <Check size={15} strokeWidth={3} />}
                {!locked && !isCurrent && !valid && <AlertTriangle size={13} strokeWidth={2.5} />}
                {(locked || isCurrent) && i + 1}
              </span>
              <span
                className={[
                  'hidden sm:inline text-xs font-display font-semibold whitespace-nowrap transition-colors duration-200',
                  locked ? 'text-text-light' : isCurrent ? 'text-primary-700' : valid ? 'text-text-secondary' : 'text-warning',
                  !locked && 'group-hover:text-primary-700',
                ].join(' ')}
              >
                {s.label}
              </span>
            </button>
            {!isLast && (
              <span
                className={[
                  'mx-2 sm:mx-3 h-0.5 flex-1 min-w-6 rounded-full transition-colors duration-300',
                  connectorFilled ? 'bg-primary-700' : 'bg-border',
                ].join(' ')}
              />
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
