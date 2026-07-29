import { User, Zap } from 'lucide-react';
import { LABEL_CLASS } from './formConstants';

interface AssignmentModeToggleProps {
  mode: 'MANUAL' | 'AUTO';
  onChange: (mode: 'MANUAL' | 'AUTO') => void;
}

export const AssignmentModeToggle = ({ mode, onChange }: AssignmentModeToggleProps) => (
  <div className="flex flex-col gap-2">
    <label className={LABEL_CLASS}>Assignment Strategy</label>
    <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-surface-muted/50 border border-border/50 rounded-lg">
      <button
        type="button"
        onClick={() => onChange('MANUAL')}
        className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-2.5 px-1 text-xs font-display font-medium rounded-md transition-all text-center ${mode === 'MANUAL'
            ? 'bg-surface text-text shadow-sm border border-border/80'
            : 'text-text-muted hover:text-text'
          }`}
      >
        <User className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Manual Dispatch</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('AUTO')}
        className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-2.5 px-1 text-xs font-display font-medium rounded-md transition-all text-center ${mode === 'AUTO'
            ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm'
            : 'text-text-muted hover:text-text'
          }`}
      >
        <Zap className="w-3.5 h-3.5 text-primary-400 shrink-0" /> <span className="truncate">Auto Assign</span>
      </button>
    </div>
  </div>
);
