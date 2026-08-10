import { Zap, X } from 'lucide-react';
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
        className="flex items-center gap-1.5 text-xs font-display font-medium text-text-muted hover:text-coral-600 transition-colors cursor-pointer"
      >
        <Zap size={13} />
        + Add conditional logic
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-coral-500/10 border border-coral-500/25">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-wider text-coral-700 dark:text-coral-400">
          <Zap size={12} />
          Conditional logic
        </span>
        <button
          type="button"
          onClick={() => { onTriggerChange(''); onActionsChange([]); }}
          className="text-text-muted hover:text-danger transition-colors cursor-pointer"
          aria-label="Remove conditional logic"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm font-display text-text-secondary flex-wrap">
        <span>If answer is</span>
        <div className="flex items-center rounded-md border border-coral-500/30 bg-surface p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onTriggerChange('YES')}
            className={[
              'px-2.5 py-1 rounded transition-colors',
              trigger === 'YES' ? 'bg-coral-500 text-white' : 'text-text-muted hover:text-text',
            ].join(' ')}
          >
            {labels.yes}
          </button>
          <button
            type="button"
            onClick={() => onTriggerChange('NO')}
            className={[
              'px-2.5 py-1 rounded transition-colors',
              trigger === 'NO' ? 'bg-coral-500 text-white' : 'text-text-muted hover:text-text',
            ].join(' ')}
          >
            {labels.no}
          </button>
        </div>
        <span>then:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ACTION_OPTIONS.map(opt => {
          const checked = actions.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleAction(opt.value)}
              className={[
                'px-2.5 py-1 rounded-full border text-xs font-display font-medium transition-colors cursor-pointer',
                checked
                  ? 'border-coral-500/60 bg-coral-500/20 text-coral-700 dark:text-coral-300'
                  : 'border-border text-text-secondary hover:bg-surface-hover',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
