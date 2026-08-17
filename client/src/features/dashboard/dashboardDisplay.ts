import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

// Mirrors taskDisplay.tsx's STATUS_CONFIG badge classes exactly — the feed sits on the same
// dashboard as the KPI modal that already uses those tokens, so the same task's status color
// shouldn't disagree depending on which widget is showing it.
export const TASK_STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-status-todo/10 text-status-todo',
  in_progress: 'bg-status-progress/10 text-status-progress',
  pending_verification: 'bg-status-verify/10 text-status-verify',
  done: 'bg-status-done/10 text-status-done',
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

// Per-month counts across a set of month buckets, e.g. for a stat card sparkline.
export const seriesInMonths = (dates: string[], months: { year: number; month: number }[]) =>
  months.map(m => countInMonth(dates, m.year, m.month));

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

// Granularities the server's compliance-report aggregation already buckets by (see
// server/src/utils/dateBucket.ts) — "quarter" isn't one of them, since Mongo's $dateToString
// can't express a quarter directly, so it isn't offered here either.
export type CompliancePeriod = 'day' | 'week' | 'month' | 'year';

export const PERIOD_LABEL: Record<CompliancePeriod, string> = {
  day: 'today',
  week: 'this week',
  month: 'this month',
  year: 'this year',
};

const pad2 = (n: number) => String(n).padStart(2, '0');

// ISO 8601 week-year + week-number (Thursday of the week decides the week-year) — matches the
// same convention Mongo's `%G-%V` format uses server-side, so a client-computed "week" bucket
// key lines up exactly with the server-aggregated one instead of drifting near year boundaries.
const isoWeek = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const isoYear = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week = 1 + Math.round(((date.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return { isoYear, week };
};

// Builds the exact same bucket key string the server's $dateToString grouping produces for
// this granularity, so a client-computed "current period" lookup actually finds its row.
export const bucketKeyFor = (period: CompliancePeriod, date: Date): string => {
  switch (period) {
    case 'day': return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    case 'week': { const { isoYear, week } = isoWeek(date); return `${isoYear}-W${pad2(week)}`; }
    case 'month': return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    case 'year': return String(date.getFullYear());
  }
};

// Start of the current period (local time) — e.g. midnight today, the Monday of this week, the
// 1st of this month/year. Used to filter a plain list of records (not server-bucketed) down to
// "just this period" client-side.
export const periodStartDate = (period: CompliancePeriod, date: Date): Date => {
  const d = new Date(date);
  if (period === 'day') { d.setHours(0, 0, 0, 0); return d; }
  if (period === 'week') {
    const dayIndex = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
    d.setDate(d.getDate() - dayIndex);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  return new Date(d.getFullYear(), 0, 1);
};

// One period-length step back (or forward, with a negative amount) — used to find "the
// previous period" for a trend comparison, at whatever granularity is currently selected.
export const shiftPeriod = (period: CompliancePeriod, date: Date, amount: number): Date => {
  const d = new Date(date);
  if (period === 'day') d.setDate(d.getDate() + amount);
  else if (period === 'week') d.setDate(d.getDate() + amount * 7);
  else if (period === 'month') d.setMonth(d.getMonth() + amount);
  else d.setFullYear(d.getFullYear() + amount);
  return d;
};