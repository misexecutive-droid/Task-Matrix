export const LABEL_CLASS = 'text-xs font-display font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5';
export const SELECT_CLASS = 'w-full px-3 h-10 text-base sm:text-sm font-display bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer hover:border-border/80';
export const SELECT_CLASS_DISABLED = `${SELECT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`;

export const ANY_DEPARTMENT = '__any__';
export const UNASSIGNED = '__unassigned__';
export const NO_CATEGORY = '__none__';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const PRIORITIES: { value: TicketPriority; label: string; activeClass: string }[] = [
  { value: 'LOW', label: 'Low', activeClass: 'border-blue-500/60 bg-blue-500/10 text-blue-400 ring-2 ring-blue-500/20' },
  { value: 'MEDIUM', label: 'Medium', activeClass: 'border-amber-500/60 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/20' },
  { value: 'HIGH', label: 'High', activeClass: 'border-orange-500/60 bg-orange-500/10 text-orange-400 ring-2 ring-orange-500/20' },
  { value: 'CRITICAL', label: 'Critical', activeClass: 'border-rose-500/60 bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/20' },
];
