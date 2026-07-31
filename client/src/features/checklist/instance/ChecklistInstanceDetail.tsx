import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Skeleton } from '../../../components';
import { useChecklistInstanceQuery } from '../hook';
import { ChecklistInstanceItemCard } from './ChecklistInstanceItemCard';
import { formatDate } from '../checklistDisplay';
import { useAuth } from '../../../context/AuthContext';

// Shared between a user's own "My Checklists" link and the admin oversight link from
// ChecklistDefinitionDetail — the server authorizes both (ADMIN or an assignee of the instance).
export const ChecklistInstanceDetail = () => {
  const { instanceId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: instance, isPending, isError } = useChecklistInstanceQuery(instanceId);

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
  const canWork = user?.role === 'ADMIN' || (!!user && instance.assigneeIds.includes(user.id));
  const isLocked = instance.verificationStatus === 'APPROVED';

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

      {instance.verificationStatus === 'PENDING' && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-primary-500/10 border border-primary-500/25 text-primary-600 dark:text-primary-300 text-xs font-mono">
          <ShieldQuestion size={16} className="shrink-0" />
          Every item is checked off — awaiting PC/Admin verification.
        </div>
      )}

      {instance.verificationStatus === 'APPROVED' && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
          <ShieldCheck size={16} className="shrink-0" />
          Verified{instance.verifiedAt ? ` on ${formatDate(instance.verifiedAt)}` : ''}.
          {instance.verificationNote ? ` "${instance.verificationNote}"` : ''}
        </div>
      )}

      {instance.verificationStatus === 'REJECTED' && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-mono">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>
            Sent back for changes{instance.verificationNote ? `: "${instance.verificationNote}"` : '.'} Fix the
            flagged items and re-check everything to resubmit.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {instance.items.map(item => (
          <ChecklistInstanceItemCard
            key={item.id}
            item={item}
            instanceId={instanceId}
            canWork={canWork}
            isLocked={isLocked}
          />
        ))}
      </div>
    </div>
  );
};
