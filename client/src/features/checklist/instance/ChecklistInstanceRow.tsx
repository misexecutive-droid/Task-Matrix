import { Link } from 'react-router';
import { Check, Circle, ClipboardList } from 'lucide-react';
import {
  formatDate,
  instanceProgressStatus,
  VERIFICATION_STATUS_LABEL,
  VERIFICATION_STATUS_STYLE,
} from '../checklistDisplay';
import type { ChecklistInstance } from '../../../api/checklistInstances';

interface ChecklistInstanceRowProps {
  instance: ChecklistInstance;
}

// One row in ChecklistDefinitionDetail's Todo/In-progress/Completed grouped instance list — the
// row-view sibling of ChecklistInstanceCard (used by MyChecklists' grid instead).
export const ChecklistInstanceRow = ({ instance }: ChecklistInstanceRowProps) => {
  const total = instance.items.length;
  const done = instance.items.filter(i => i.isDone).length;
  const status = instanceProgressStatus(done, total);

  return (
    <Link
      to={`/checklists/${instance.id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all"
    >
      {status === 'COMPLETED' ? (
        <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500 text-white shrink-0">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : (
        <Circle
          size={20}
          className={`shrink-0 ${status === 'IN_PROGRESS' ? 'text-amber-500' : 'text-text-light'}`}
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium text-text truncate">
          {formatDate(instance.periodStart)} — {formatDate(instance.periodEnd)}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-text-muted font-mono">
            <ClipboardList size={11} /> {done}/{total}
          </span>
          <span
            className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${VERIFICATION_STATUS_STYLE[instance.verificationStatus]}`}
          >
            {VERIFICATION_STATUS_LABEL[instance.verificationStatus]}
          </span>
        </div>
      </div>

      <span className="text-xs text-text-muted font-mono shrink-0">{formatDate(instance.generatedAt)}</span>
    </Link>
  );
};
