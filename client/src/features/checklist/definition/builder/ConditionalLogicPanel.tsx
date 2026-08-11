import { Zap, ChevronRight, Check, X } from 'lucide-react';
import type { ChecklistConditionalAction } from '../../../../api/checklistDefinitions';

const TRIGGER_LABELS: Record<'YES_NO' | 'PASS_FAIL', { yes: string; no: string }> = {
  YES_NO: { yes: 'Yes', no: 'No' },
  PASS_FAIL: { yes: 'Pass', no: 'Fail' },
};

const ACTION_OPTIONS: { value: ChecklistConditionalAction; label: string }[] = [
  { value: 'REQUIRE_PHOTO', label: 'Photo mandatory' },
  { value: 'ASK_REASON', label: 'Ask reason' },
  { value: 'CREATE_ISSUE', label: 'Create issue' },
  { value: 'NOTIFY_AREA_MANAGER', label: 'Notify Area Manager' },
];

interface ConditionalLogicPanelProps {
  itemType: 'YES_NO' | 'PASS_FAIL';
  trigger: 'YES' | 'NO' | '';
  actions: ChecklistConditionalAction[];
  onTriggerChange: (trigger: 'YES' | 'NO' | '') => void;
  onActionsChange: (actions: ChecklistConditionalAction[]) => void;
}

// The Builder's "if answer is X then: …" panel — only meaningful for YES_NO/PASS_FAIL items,
// enforced server-side by checklistInstance.service.ts's setItemDone.
export const ConditionalLogicPanel = ({ itemType, trigger, actions, onTriggerChange, onActionsChange }: ConditionalLogicPanelProps) => {
  const labels = TRIGGER_LABELS[itemType];

  const toggleAction = (action: ChecklistConditionalAction) => {
    onActionsChange(actions.includes(action) ? actions.filter(a => a !== action) : [...actions, action]);
  };

  if (!trigger) {
    return (
      <button
        type="button"
        onClick={() => onTriggerChange('NO')}
        className="group/trigger flex items-center gap-2 px-3 py-2 mt-2 rounded-lg border border-dashed border-coral-300 bg-coral-50/50 text-xs font-display font-semibold text-coral-700 transition-all duration-200 ease-out hover:border-coral-400 hover:bg-coral-100 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:shadow-none cursor-pointer w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-1"
      >
        <Zap size={14} className="transition-transform duration-200 group-hover/trigger:scale-110 group-hover/trigger:-rotate-6" />
        Add conditional logic
      </button>
    );
  }

  const activeSummary = actions.length
    ? actions.map(a => ACTION_OPTIONS.find(o => o.value === a)?.label).filter(Boolean).join(', ')
    : null;

  return (
    <div className="flex flex-col gap-3 p-4 mt-2 rounded-xl bg-gradient-to-br from-coral-500/10 via-coral-500/5 to-transparent border border-coral-500/30 shadow-sm animate-fade-in-up">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-coral-700 dark:text-coral-400">
          <span className="flex items-center justify-center size-5 rounded-md bg-coral-500/20 text-coral-600">
            <Zap size={12} />
          </span>
          Logic Rule
        </span>
        <button
          type="button"
          onClick={() => { onTriggerChange(''); onActionsChange([]); }}
          className="p-1.5 rounded-md text-text-muted transition-colors duration-150 hover:text-danger hover:bg-danger/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/50"
          aria-label="Remove conditional logic"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm font-display text-text-secondary flex-wrap bg-surface p-2 rounded-lg border border-coral-500/20">
        <span className="font-medium">If answer is</span>
        <div className="flex items-center rounded-md border border-coral-500/30 bg-coral-500/10 p-0.5 text-xs">
          {(['YES', 'NO'] as const).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => onTriggerChange(value)}
              aria-pressed={trigger === value}
              className={[
                'px-3 py-1.5 rounded transition-all duration-200 ease-out font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500',
                trigger === value ? 'bg-surface text-coral-700 shadow-sm' : 'text-text-muted hover:text-text hover:bg-white/40',
              ].join(' ')}
            >
              {value === 'YES' ? labels.yes : labels.no}
            </button>
          ))}
        </div>
        <ChevronRight size={13} className="text-coral-400 shrink-0" />
        <span className="font-medium">then require:</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-0.5">
        {ACTION_OPTIONS.map(opt => {
          const checked = actions.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleAction(opt.value)}
              aria-pressed={checked}
              className={[
                'group/chip flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-display font-semibold transition-all duration-200 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500',
                checked
                  ? 'border-coral-500 bg-coral-50 text-coral-700 shadow-sm scale-[1.02]'
                  : 'border-coral-500/30 bg-surface text-coral-700 hover:bg-coral-500/10 hover:border-coral-500/50',
              ].join(' ')}
            >
              <span
                className={[
                  'flex items-center justify-center size-3.5 rounded-full border transition-all duration-200',
                  checked ? 'border-coral-600 bg-coral-600 text-white' : 'border-coral-500/40 bg-transparent group-hover/chip:border-coral-500/70',
                ].join(' ')}
              >
                {checked && <Check size={9} strokeWidth={3.5} />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {activeSummary && (
        <p className="text-[11px] font-display text-coral-700/80 bg-coral-500/5 border border-coral-500/10 rounded-md px-2.5 py-1.5 animate-fade-in">
          Rule: if <span className="font-bold">{trigger === 'YES' ? labels.yes : labels.no}</span> → {activeSummary}
        </p>
      )}
    </div>
  );
};
