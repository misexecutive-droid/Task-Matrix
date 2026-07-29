import { Link } from 'react-router';
import { formatDateShort } from '../checklistDisplay';
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

  return (
    <Link
      to={`/checklists/${instance.id}`}
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-primary-500/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-mono font-medium text-text">{instance.title}</p>
        {isComplete && (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            Done
          </span>
        )}
      </div>

      <p className="text-xs text-text-muted font-mono">
        {formatDateShort(instance.periodStart)} – {formatDateShort(instance.periodEnd)}
      </p>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-surface-hover rounded-full overflow-hidden border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted font-mono font-medium w-8 text-right">{done}/{total}</span>
      </div>
    </Link>
  );
};
