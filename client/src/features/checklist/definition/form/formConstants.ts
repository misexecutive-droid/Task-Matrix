import type { ChecklistRecurrence } from '../../../../api/checklistDefinitions';

export const LABEL_CLASS =
  'text-xs font-display font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 select-none';

export const INPUT_BASE_CLASS =
  'w-full px-3 sm:px-3.5 py-2.5 text-sm font-display bg-surface/60 text-text rounded-lg border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/60 transition-all duration-200 placeholder:text-text-muted/50 hover:border-border';

export const SELECT_TRIGGER_CLASS =
  'w-full h-10 px-3 sm:px-3.5 text-sm font-display bg-surface/60 text-text rounded-lg border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/60 transition-all cursor-pointer hover:border-border';

export const RECURRENCE_OPTIONS: { value: ChecklistRecurrence; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One-time' },
];
