import { AlertCircle, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '../../components';
import { useMyChecklistInstancesQuery } from './hook';
import { ChecklistInstanceCard } from './ChecklistInstanceCard';
import { RECURRENCE_LABEL } from './checklistDisplay';
import type { ChecklistInstance } from '../../api/checklistInstances';
import type { ChecklistRecurrence } from '../../api/checklistDefinitions';

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
                {group.map(instance => <ChecklistInstanceCard key={instance.id} instance={instance} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
