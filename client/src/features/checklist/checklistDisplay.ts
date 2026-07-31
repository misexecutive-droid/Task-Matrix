import type { ChecklistRecurrence } from '../../api/checklistDefinitions';
import type { ChecklistVerificationStatus } from '../../api/checklistInstances';

// Shared display lookups/helpers for the checklist feature — used by ChecklistDefinitionList,
// ChecklistDefinitionDetail, ChecklistInstanceDetail, and MyChecklists. Previously each of those
// files redefined its own copy of these.

export const RECURRENCE_LABEL: Record<ChecklistRecurrence, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One-time',
};

// periodStart/periodEnd/startDate are calendar-day labels stored as UTC midnight of the intended
// day (see server/src/utils/period.ts) — rendering them with the viewer's local timezone can roll
// them back a day for anyone whose browser clock sits behind UTC. Pinning timeZone: 'UTC' makes
// the displayed date match the label exactly, for every viewer, regardless of local system time.

// e.g. "Jan 5, 2026" — used where the year matters (definition/instance detail pages).
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// e.g. "Jan 5" — used in tighter card layouts (MyChecklists) where the year is implied.
export const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

// Derived from item completion, not stored on the instance — mirrors what ChecklistInstanceCard's
// `isComplete` check already computed inline, generalized to the third "some done" bucket used by
// ChecklistDefinitionDetail's grouped instance list.
export type InstanceProgressStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export const instanceProgressStatus = (done: number, total: number): InstanceProgressStatus => {
  if (total > 0 && done === total) return 'COMPLETED';
  if (done > 0) return 'IN_PROGRESS';
  return 'TODO';
};

export const INSTANCE_STATUS_LABEL: Record<InstanceProgressStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const INSTANCE_STATUS_STYLE: Record<InstanceProgressStatus, string> = {
  TODO: 'bg-surface-hover text-text-muted border-border',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

export const VERIFICATION_STATUS_LABEL: Record<ChecklistVerificationStatus, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

export const VERIFICATION_STATUS_STYLE: Record<ChecklistVerificationStatus, string> = {
  NOT_SUBMITTED: 'bg-surface-hover text-text-muted border-border',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-danger/10 text-danger border-danger/20',
};
