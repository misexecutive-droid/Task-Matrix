import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Skeleton } from '../../components';
import { useChecklistInstanceQuery, useSetChecklistInstanceItemDoneMutation } from './hook';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Shared between a user's own "My Checklists" link and the admin oversight link from
// ChecklistDefinitionDetail — the server authorizes both (ADMIN or an assignee of the instance).
export const ChecklistInstanceDetail = () => {
  const { instanceId = '' } = useParams();
  const navigate = useNavigate();
  const { data: instance, isPending, isError } = useChecklistInstanceQuery(instanceId);
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !instance) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono max-w-2xl">
        <AlertCircle size={15} />
        Failed to load checklist.
      </div>
    );
  }

  const total = instance.items.length;
  const done = instance.items.filter(i => i.isDone).length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface">
        <h1 className="text-lg font-mono font-semibold text-text">{instance.title}</h1>
        <p className="text-xs text-text-muted font-mono">
          {formatDate(instance.periodStart)} – {formatDate(instance.periodEnd)}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-1.5 flex-1 bg-surface-hover rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-text-muted shrink-0">{done}/{total} done</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {instance.items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setItemDone.mutate({ itemId: item.id, isDone: !item.isDone })}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
              item.isDone ? 'border-border/50 bg-surface opacity-75' : 'border-border bg-surface hover:border-primary-500/30 hover:shadow-sm'
            }`}
          >
            <span className={`flex items-center justify-center size-7 rounded-lg shrink-0 transition-colors ${
              item.isDone ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface-hover text-text-light border border-border'
            }`}>
              {item.isDone ? <CheckSquare size={15} /> : <Square size={15} />}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-mono ${item.isDone ? 'line-through text-text-muted' : 'text-text'}`}>
                {item.label}
              </p>
              {item.isDone && item.completedAt && (
                <p className="text-[11px] text-text-muted font-mono mt-0.5">
                  Completed {formatDate(item.completedAt)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
