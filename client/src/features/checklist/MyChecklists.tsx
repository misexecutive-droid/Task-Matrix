import { Link } from 'react-router';
import { AlertCircle, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '../../components';
import { useMyChecklistInstancesQuery } from './hook';
import type { ChecklistInstance } from '../../api/checklistInstances';
import type { ChecklistRecurrence } from '../../api/checklistDefinitions';

const RECURRENCE_LABEL: Record<ChecklistRecurrence, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One-time',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const InstanceCard = ({ instance }: { instance: ChecklistInstance }) => {
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
        {formatDate(instance.periodStart)} – {formatDate(instance.periodEnd)}
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

export const MyChecklists = () => {
  const { data: instances = [], isPending, isError } = useMyChecklistInstancesQuery();

  const grouped = new Map<ChecklistRecurrence, ChecklistInstance[]>();
  for (const instance of instances) {
    if (!grouped.has(instance.recurrence)) grouped.set(instance.recurrence, []);
    grouped.get(instance.recurrence)!.push(instance);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
          <ClipboardCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-mono font-semibold text-text">My Checklists</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {instances.length} checklist{instances.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
      </div>

      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono">
          <AlertCircle size={15} />
          Failed to load your checklists.
        </div>
      )}

      {!isPending && !isError && instances.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
          <ClipboardCheck size={28} className="text-text-light" />
          <p className="text-sm font-mono">No checklists assigned to you yet.</p>
        </div>
      )}

      {!isPending && !isError && instances.length > 0 && (
        <div className="flex flex-col gap-6">
          {[...grouped.entries()].map(([recurrence, group]) => (
            <div key={recurrence} className="flex flex-col gap-3">
              <h3 className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
                {RECURRENCE_LABEL[recurrence]}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.map(instance => <InstanceCard key={instance.id} instance={instance} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
