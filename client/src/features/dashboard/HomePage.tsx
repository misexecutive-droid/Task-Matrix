import { Link } from 'react-router';
import { Plus, Ticket as TicketIcon, CheckSquare, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery } from '../tickets/hook';
import { useTasksQuery } from '../tasks/hook';
import { Button, Skeleton } from '../../components';
import { StatusBarChart } from './StatusBarChart';
import { ActivityTrendChart } from './ActivityTrendChart';
import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

const TICKET_STATUS_ORDER: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'ON_HOLD', 'CLOSED'];
const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', ON_HOLD: 'On hold', CLOSED: 'Closed',
};
const TICKET_STATUS_BAR_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-slate-400 dark:bg-slate-500',
  IN_PROGRESS: 'bg-amber-500',
  IN_REVIEW: 'bg-primary-500',
  ON_HOLD: 'bg-slate-400 dark:bg-slate-500',
  CLOSED: 'bg-emerald-500',
};

const TASK_STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];
const TASK_STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To do', in_progress: 'In progress', pending_verification: 'Pending verification', done: 'Done',
};
const TASK_STATUS_BAR_COLORS: Record<Task['status'], string> = {
  todo: 'bg-slate-400 dark:bg-slate-500',
  in_progress: 'bg-amber-500',
  pending_verification: 'bg-indigo-500',
  done: 'bg-emerald-500',
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const TREND_DAYS = 14;

const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-surface-hover text-text-secondary',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  IN_REVIEW: 'bg-primary-500/10 text-primary-700 dark:text-primary-300',
  CLOSED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ON_HOLD: 'bg-surface-hover text-text-secondary',
};

const TASK_STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-surface-hover text-text-secondary',
  in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pending_verification: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

type FeedItem =
  | { kind: 'ticket'; id: string; title: string; status: TicketStatus; createdAt: string }
  | { kind: 'task'; id: string; title: string; status: Task['status']; createdAt: string };

interface StatDelta {
  text:      string;
  tone:      'up' | 'down' | 'neutral';
}

const DELTA_TONE_CLASS: Record<StatDelta['tone'], string> = {
  up:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  down:    'bg-danger/10 text-danger',
  neutral: 'bg-surface-hover text-text-muted',
};

const StatTile = ({ icon: Icon, label, value, tint, delta }: {
  icon: typeof TicketIcon; label: string; value: number; tint: string; delta?: StatDelta;
}) => (
  <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm">
    <div className={`flex items-center justify-center size-11 rounded-xl shrink-0 ${tint}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-sm text-text-muted font-display">{label}</p>
      <div className="flex items-end justify-between gap-2 mt-1.5">
        <p className="text-2xl font-display font-bold text-text leading-none">{value}</p>
        {delta && (
          <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${DELTA_TONE_CLASS[delta.tone]}`}>
            {delta.text}
          </span>
        )}
      </div>
    </div>
  </div>
);

export const HomePage = () => {
  const { user } = useAuth();
  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1 , 100);
  const { data: tasks, isPending: tasksPending } = useTasksQuery();

  const tickets = ticketPage?.data ?? [];
  const isPending = ticketsPending || tasksPending;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const openTickets = tickets.filter(t => t.status !== 'CLOSED').length;
  const openTasks = (tasks ?? []).filter(t => t.status !== 'done').length;
  const overdueTickets = tickets.filter(t => t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length;
  const overdueTasks = (tasks ?? []).filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length;
  const overdueCount = overdueTickets + overdueTasks;
  const newTicketsThisWeek = tickets.filter(t => new Date(t.createdAt).getTime() >= weekAgo).length;
  const newTasksThisWeek = (tasks ?? []).filter(t => new Date(t.createdAt).getTime() >= weekAgo).length;

  const feed: FeedItem[] = [
    ...tickets.map((t): FeedItem => ({ kind: 'ticket', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
    ...(tasks ?? []).map((t): FeedItem => ({ kind: 'task', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const ticketStatusData = TICKET_STATUS_ORDER.map(status => ({
    label: TICKET_STATUS_LABELS[status],
    value: tickets.filter(t => t.status === status).length,
    colorClass: TICKET_STATUS_BAR_COLORS[status],
  }));

  const taskStatusData = TASK_STATUS_ORDER.map(status => ({
    label: TASK_STATUS_LABELS[status],
    value: (tasks ?? []).filter(t => t.status === status).length,
    colorClass: TASK_STATUS_BAR_COLORS[status],
  }));

  const trendData = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (TREND_DAYS - 1 - i));
    const key = dayKey(date);
    return {
      date,
      tickets: tickets.filter(t => dayKey(new Date(t.createdAt)) === key).length,
      tasks: (tasks ?? []).filter(t => dayKey(new Date(t.createdAt)) === key).length,
    };
  });

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text">
            {greeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/tickets">
            <Button size="sm" variant="outline" className="gap-1.5">
              <TicketIcon size={14} />
              New ticket
            </Button>
          </Link>
          <Link to="/tasks">
            <Button size="sm" variant="primary" className="gap-1.5">
              <Plus size={14} />
              New task
            </Button>
          </Link>
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            icon={TicketIcon}
            label="Open tickets"
            value={openTickets}
            tint="bg-primary-500/10 text-primary-600 dark:text-primary-300"
            delta={{ text: `+${newTicketsThisWeek} this week`, tone: newTicketsThisWeek > 0 ? 'up' : 'neutral' }}
          />
          <StatTile
            icon={CheckSquare}
            label="Open tasks"
            value={openTasks}
            tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            delta={{ text: `+${newTasksThisWeek} this week`, tone: newTasksThisWeek > 0 ? 'up' : 'neutral' }}
          />
          <StatTile
            icon={AlertTriangle}
            label="Overdue"
            value={overdueCount}
            tint="bg-danger/10 text-danger"
            delta={overdueCount > 0
              ? { text: `${overdueTickets} tickets · ${overdueTasks} tasks`, tone: 'down' }
              : { text: 'All caught up', tone: 'up' }}
          />
        </div>
      )}

      {isPending ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatusBarChart title="Tickets by status" data={ticketStatusData} unit="ticket" />
          <StatusBarChart title="Tasks by status" data={taskStatusData} unit="task" />
        </div>
      )}

      {isPending ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <ActivityTrendChart title="Activity" data={trendData} />
      )}

      <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-display font-semibold text-text">Recent activity</h2>
          <div className="flex gap-3 text-xs font-display">
            <Link to="/tickets" className="flex items-center gap-1 text-text-muted hover:text-primary-500 transition-colors">
              Tickets <ArrowRight size={12} />
            </Link>
            <Link to="/tasks" className="flex items-center gap-1 text-text-muted hover:text-primary-500 transition-colors">
              Tasks <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {isPending ? (
          <div className="flex flex-col">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                <Skeleton className="size-7 rounded-md shrink-0" />
                <Skeleton className="h-4 flex-1 max-w-56" />
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-text-muted gap-2">
            <Clock size={24} className="text-text-light" />
            <p className="text-sm font-display">Nothing here yet — create a ticket or task to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {feed.map(item => (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.kind === 'ticket' ? '/tickets' : '/tasks'}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors"
              >
                <div className={`flex items-center justify-center size-7 rounded-md shrink-0 ${
                  item.kind === 'ticket' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {item.kind === 'ticket' ? <TicketIcon size={13} /> : <CheckSquare size={13} />}
                </div>
                <p className="flex-1 min-w-0 text-sm font-display text-text truncate">{item.title}</p>
                <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  item.kind === 'ticket' ? TICKET_STATUS_COLORS[item.status as TicketStatus] : TASK_STATUS_COLORS[item.status as Task['status']]
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-text-light font-display shrink-0">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};