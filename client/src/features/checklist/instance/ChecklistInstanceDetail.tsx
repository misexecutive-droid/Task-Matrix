import type { ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Skeleton } from '../../../components';
import { useChecklistInstanceQuery } from '../hook';
import { ChecklistInstanceItemCard } from './ChecklistInstanceItemCard';
import { ChecklistInstanceItemAuditCard } from './ChecklistInstanceItemAuditCard';
import { ChecklistInstanceItemNumberEntryCard } from './ChecklistInstanceItemNumberEntryCard';
import { ChecklistInstanceItemRatingCard } from './ChecklistInstanceItemRatingCard';
import { ChecklistInstanceItemBooleanCard } from './ChecklistInstanceItemBooleanCard';
import { ChecklistInstanceItemChoiceCard } from './ChecklistInstanceItemChoiceCard';
import { ChecklistInstanceItemTextCard } from './ChecklistInstanceItemTextCard';
import { ChecklistInstanceItemDateTimeCard } from './ChecklistInstanceItemDateTimeCard';
import { ChecklistInstanceItemGpsCard } from './ChecklistInstanceItemGpsCard';
import { ChecklistInstanceItemSignatureCard } from './ChecklistInstanceItemSignatureCard';
import { ChecklistInstanceItemDualSignatureCard } from './ChecklistInstanceItemDualSignatureCard';
import { ChecklistInstanceItemQrScanCard } from './ChecklistInstanceItemQrScanCard';
import { ChecklistInstanceItemCashTallyCard } from './ChecklistInstanceItemCashTallyCard';
import { formatDate } from '../checklistDisplay';
import { useAuth } from '../../../context/AuthContext';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';

type ItemCardContext = { instanceId: string; canWork: boolean; isLocked: boolean; currentUserId?: string };

// Which card renders a given item — AUDIT items fan out into per-auditor submissions
// (ChecklistInstanceItemAuditCard, its own currentUserId-scoped interactivity), everything else
// keeps the original single-state card. A lookup map of render closures, not an if/else, since
// the two cards take different prop shapes and can't share one component reference directly.
const ITEM_CARD_RENDERERS: Record<ChecklistInstanceItem['itemType'], (item: ChecklistInstanceItem, ctx: ItemCardContext) => ReactElement> = {
  STANDARD: (item, ctx) => (
    <ChecklistInstanceItemCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  AUDIT: (item, ctx) => (
    <ChecklistInstanceItemAuditCard item={item} instanceId={ctx.instanceId} currentUserId={ctx.currentUserId} isLocked={ctx.isLocked} />
  ),
  NUMBER_ENTRY: (item, ctx) => (
    <ChecklistInstanceItemNumberEntryCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  RATING: (item, ctx) => (
    <ChecklistInstanceItemRatingCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  YES_NO: (item, ctx) => (
    <ChecklistInstanceItemBooleanCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  PASS_FAIL: (item, ctx) => (
    <ChecklistInstanceItemBooleanCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  MULTIPLE_CHOICE: (item, ctx) => (
    <ChecklistInstanceItemChoiceCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  DROPDOWN: (item, ctx) => (
    <ChecklistInstanceItemChoiceCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  TEXT_BOX: (item, ctx) => (
    <ChecklistInstanceItemTextCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  DATE_TIME: (item, ctx) => (
    <ChecklistInstanceItemDateTimeCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  GPS: (item, ctx) => (
    <ChecklistInstanceItemGpsCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  SIGNATURE: (item, ctx) => (
    <ChecklistInstanceItemSignatureCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  DUAL_SIGNATURE: (item, ctx) => (
    <ChecklistInstanceItemDualSignatureCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  QR_SCAN: (item, ctx) => (
    <ChecklistInstanceItemQrScanCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  CASH_TALLY: (item, ctx) => (
    <ChecklistInstanceItemCashTallyCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
  // VIDEO_UPLOAD reuses the STANDARD photo-evidence card — same upload pipeline, the card itself
  // renders a <video> instead of an <img> and swaps the accept/button copy based on itemType.
  VIDEO_UPLOAD: (item, ctx) => (
    <ChecklistInstanceItemCard item={item} instanceId={ctx.instanceId} canWork={ctx.canWork} isLocked={ctx.isLocked} />
  ),
};

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
          <div key={item.id}>
            {ITEM_CARD_RENDERERS[item.itemType](item, { instanceId, canWork, isLocked, currentUserId: user?.id })}
          </div>
        ))}
      </div>
    </div>
  );
};
