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

// e.g. "Jan 5, 2026" — used where the year matters (definition/instance detail pages).
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// e.g. "Jan 5" — used in tighter card layouts (MyChecklists) where the year is implied.
export const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
