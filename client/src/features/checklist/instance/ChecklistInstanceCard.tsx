import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { formatDateShort, rateToneClass, rateBarClass, isInstanceOverdue } from '../checklistDisplay';
import type { ChecklistInstance } from '../../../api/checklistInstances';

interface ChecklistInstanceCardProps {
  instance: ChecklistInstance;
}

// One card in MyChecklists' grid — the card-view sibling of ChecklistInstanceRow (used by
// ChecklistDefinitionDetail's list instead).
export const ChecklistInstanceCard = ({ instance }: ChecklistInstanceCardProps) => {
  const total = instance.items.length;
  const done = instance.items.filter(i => i.isDone).length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;
  const overdue = isInstanceOverdue(instance.periodEnd, isComplete);

  return (
    <Link
      to={`/checklists/${instance.id}`}
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-primary-500/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-mono font-medium text-text">{instance.title}</p>
        {isComplete ? (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            Done
          </span>
        ) : (
          <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${rateToneClass(progress)} bg-surface-hover`}>
            Mark {progress}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-text-muted font-mono">
          {formatDateShort(instance.periodStart)} – {formatDateShort(instance.periodEnd)}
        </p>
        {overdue && (
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-danger/10 text-danger">
            <Clock size={10} /> Overdue
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-surface-hover rounded-full overflow-hidden border border-border/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${rateBarClass(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted font-mono font-medium w-8 text-right">{done}/{total}</span>
      </div>
    </Link>
  );
};
