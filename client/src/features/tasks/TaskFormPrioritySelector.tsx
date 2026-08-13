import { Sparkles } from 'lucide-react';
import { PRIORITY_MAP } from './taskDisplay';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';
import type { Task } from '../../api/task';

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface TaskFormPrioritySelectorProps {
  value: Task['priority'];
  onChange: (value: Task['priority']) => void;
  disabled?: boolean;
}

export const TaskFormPrioritySelector = ({ value, onChange, disabled = false }: TaskFormPrioritySelectorProps) => (
  <div className="group/field">
    <label className={FIELD_LABEL_CLASS}>
      <Sparkles className={FIELD_LABEL_ICON_CLASS} /> Priority Level 
    </label>
    
    {/* Segmented Control Container */}
    <div className="grid grid-cols-3 gap-1.5 p-1 rounded border border-border bg-surface-hover focus-within:ring-primary-500/20 transition-all">
      {PRIORITIES.map((p) => {
        const isSelected = value === p.value;
        const meta = PRIORITY_MAP[p.value];

        return (
          <button
            key={p.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(p.value)}
            disabled={disabled}
            className={`relative flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded border transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? `${meta.className} shadow-sm`
                : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-surface-active/50'
            }`}
          >
           
            <span className="truncate">{p.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);