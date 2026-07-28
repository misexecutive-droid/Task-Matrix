import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

export const TICKET_STATUS_ORDER: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'ON_HOLD', 'CLOSED'];
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', ON_HOLD: 'On hold', CLOSED: 'Closed',
};
export const TICKET_STATUS_BAR_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-slate-400 dark:bg-slate-500',
  IN_PROGRESS: 'bg-amber-500',
  IN_REVIEW: 'bg-primary-500',
  ON_HOLD: 'bg-slate-400 dark:bg-slate-500',
  CLOSED: 'bg-emerald-500',
};
export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-surface-hover text-text-secondary',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  IN_REVIEW: 'bg-primary-500/10 text-primary-700 dark:text-primary-300',
  CLOSED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ON_HOLD: 'bg-surface-hover text-text-secondary',
};

export const TASK_STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];
export const TASK_STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To do', in_progress: 'In progress', pending_verification: 'Pending verification', done: 'Done',
};
export const TASK_STATUS_BAR_COLORS: Record<Task['status'], string> = {
  todo: 'bg-slate-400 dark:bg-slate-500',
  in_progress: 'bg-amber-500',
  pending_verification: 'bg-indigo-500',
  done: 'bg-emerald-500',
};
export const TASK_STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-surface-hover text-text-secondary',
  in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pending_verification: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export const TREND_DAYS = 14;

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export type FeedItem =
  | { kind: 'ticket'; id: string; title: string; status: TicketStatus; createdAt: string }
  | { kind: 'task'; id: string; title: string; status: Task['status']; createdAt: string };
