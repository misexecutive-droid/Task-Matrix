import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

// Updated to match the new premium badge style (requires a generic 'border' class on the consumer)
export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-surface-hover text-text border-border/50',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  IN_REVIEW: 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border-primary-500/20',
  CLOSED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  ON_HOLD: 'bg-surface text-text-muted border-border/50 opacity-80',
};

// Updated to match the new premium badge style
export const TASK_STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-surface-hover text-text border-border/50',
  in_progress: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  pending_verification: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  done: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export type FeedItem =
  | { kind: 'ticket'; id: string; title: string; status: TicketStatus; createdAt: string }
  | { kind: 'task'; id: string; title: string; status: Task['status']; createdAt: string };

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Last `count` calendar months ending with the current one, oldest first.
export const lastMonths = (count: number) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
};

const isSameMonth = (isoDate: string, year: number, month: number) => {
  const d = new Date(isoDate);
  return d.getFullYear() === year && d.getMonth() === month;
};

export const countInMonth = (dates: string[], year: number, month: number) =>
  dates.filter(d => isSameMonth(d, year, month)).length;

export type Trend = { direction: 'up' | 'down'; label: string };

// Percent change from `previous` to `current`, expressed as a stat-card trend badge.
// No history to compare against yet (previous === 0) reads as flat, not a fabricated spike.
export const trendFrom = (current: number, previous: number): Trend => {
  if (previous === 0) return { 
    direction: current > 0 ? 'up' : 'down', 
    label: current > 0 ? 'New' : '0%' 
  };
  
  const pct = ((current - previous) / previous) * 100;
  return { 
    direction: pct >= 0 ? 'up' : 'down', 
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` 
  };
};

// Difference between two already-percentage values (e.g. two months' completion rates) —
// a plain point delta, not a percent-of-a-percent, so "76% vs 72%" reads as "+4%" not "+5.6%".
export const pointDelta = (current: number, previous: number): Trend => {
  const diff = current - previous;
  return { 
    direction: diff >= 0 ? 'up' : 'down', 
    label: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%` 
  };
};