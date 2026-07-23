import { Link } from 'react-router';
import { Plus, Ticket as TicketIcon, CheckSquare, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery } from '../tickets/hook';
import { useTasksQuery } from '../tasks/hook';
import { Button, Skeleton } from '../../components';
import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

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

const StatTile = ({ icon: Icon, label, value, tint }: { icon: typeof TicketIcon; label: string; value: number; tint: string }) => (
  <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
    <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${tint}`}>
      <Icon size={17} />
    </div>
    <div>
      <p className="text-lg font-display font-semibold text-text leading-none">{value}</p>
      <p className="text-xs text-text-muted font-display mt-1">{label}</p>
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
  const openTickets = tickets.filter(t => t.status !== 'CLOSED').length;
  const openTasks = (tasks ?? []).filter(t => t.status !== 'done').length;
  const overdueCount =
    tickets.filter(t => t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length +
    (tasks ?? []).filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length;

  const feed: FeedItem[] = [
    ...tickets.map((t): FeedItem => ({ kind: 'ticket', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
    ...(tasks ?? []).map((t): FeedItem => ({ kind: 'task', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

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
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-surface">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile icon={TicketIcon} label="Open tickets" value={openTickets} tint="bg-primary-500/10 text-primary-600 dark:text-primary-300" />
          <StatTile icon={CheckSquare} label="Open tasks" value={openTasks} tint="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          <StatTile icon={AlertTriangle} label="Overdue" value={overdueCount} tint="bg-danger/10 text-danger" />
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
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