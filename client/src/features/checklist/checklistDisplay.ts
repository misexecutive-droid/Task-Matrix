import type { ChecklistRecurrence } from '../../api/checklistDefinitions';

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
