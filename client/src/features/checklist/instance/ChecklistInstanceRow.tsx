import { Link } from 'react-router';
import { formatDate } from '../checklistDisplay';
import type { ChecklistInstance } from '../../../api/checklistInstances';

interface ChecklistInstanceRowProps {
  instance: ChecklistInstance;
}

// One row in ChecklistDefinitionDetail's list of generated instances — the row-view sibling of
// ChecklistInstanceCard (used by MyChecklists' grid instead).
export const ChecklistInstanceRow = ({ instance }: ChecklistInstanceRowProps) => {
  const total = instance.items.length;
  const done = instance.items.filter(i => i.isDone).length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      to={`/checklists/${instance.id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium text-text">
          {formatDate(instance.periodStart)} — {formatDate(instance.periodEnd)}
        </p>
        <p className="text-xs text-text-muted font-mono mt-0.5">Generated {formatDate(instance.generatedAt)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-1.5 w-24 bg-surface-hover rounded-full overflow-hidden border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono text-text-muted w-10 text-right">{done}/{total}</span>
      </div>
    </Link>
  );
};
