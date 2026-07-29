import type { Ticket, TicketStatus, RestrictedStatus } from '../../../api/ticket';

// The 3 statuses a non-verifier (assignee/creator/manager) can move a ticket to through the
// dedicated "Update Status" panel — deliberately narrower than STATUS_OPTIONS, which still
// powers the full dropdown verifiers (PC/Admin) see. "Completed" is the human label for
// IN_REVIEW: from this role's perspective they're done, even though it still needs PC sign-off.
export const STATUS_UPDATE_OPTIONS: { value: RestrictedStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'IN_REVIEW', label: 'Completed' },
];

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

export const STATUS_CONFIG: Record<TicketStatus, { bg: string; text: string; border: string }> = {
  OPEN: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20' },
  IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  IN_REVIEW: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  CLOSED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  ON_HOLD: { bg: 'bg-surface-muted', text: 'text-text-muted', border: 'border-border' },
};

export const PRIORITY_CONFIG: Record<Ticket['priority'], { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
  MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  CRITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
};

export const UPLOADS_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

export const SECTION_HEADER = 'text-xs font-display font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-2';
