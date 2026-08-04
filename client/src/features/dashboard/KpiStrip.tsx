import { useMemo, useState } from 'react';
import { Ticket as TicketIcon, CheckSquare, Clock, CheckCircle2, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { Modal } from '../../components';
import { STATUS_CONFIG, PRIORITY_MAP } from '../tasks/taskDisplay';
import { lastMonths, countInMonth, trendFrom } from './dashboardDisplay';
import type { Task } from '../../api/task';
import type { Ticket } from '../../api/ticket';

type FilterKey = 'pending' | 'completed' | 'due';

const FILTERS: Record<FilterKey, { label: string; match: (t: Task, now: number) => boolean }> = {
  pending:   { label: 'Pending Tasks',   match: (t) => t.status !== 'done' },
  completed: { label: 'Completed Tasks', match: (t) => t.status === 'done' },
  due:       { label: 'Overdue Tasks',   match: (t, now) => t.status !== 'done' && !!t.dueDate && new Date(t.dueDate).getTime() < now },
};

interface KpiStripProps {
  tickets: Ticket[];
  tasks: Task[];
  isPending: boolean;
}

interface Tile {
  key: string;
  label: string;
  value: number;
  icon: typeof TicketIcon;
  tint: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down';
  onClick?: () => void;
}

export const KpiStrip = ({ tickets, tasks, isPending }: KpiStripProps) => {
  const [active, setActive] = useState<FilterKey | null>(null);
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);

  if (isPending) {
    return <div className="h-[84px] rounded-2xl border border-border bg-surface animate-pulse" />;
  }

  const [prevMonth, curMonth] = lastMonths(2);
  const ticketTrend = trendFrom(
    countInMonth(tickets.map(t => t.createdAt), curMonth.year, curMonth.month),
    countInMonth(tickets.map(t => t.createdAt), prevMonth.year, prevMonth.month),
  );
  const taskTrend = trendFrom(
    countInMonth(tasks.map(t => t.createdAt), curMonth.year, curMonth.month),
    countInMonth(tasks.map(t => t.createdAt), prevMonth.year, prevMonth.month),
  );

  const tiles: Tile[] = [
    {
      key: 'openTickets', label: 'Open Tickets', value: tickets.filter(t => t.status !== 'CLOSED').length,
      icon: TicketIcon, tint: 'bg-primary-500/10 text-primary-600 dark:text-primary-300',
      trendLabel: ticketTrend.label, trendDirection: ticketTrend.direction,
    },
    {
      key: 'openTasks', label: 'Open Tasks', value: tasks.filter(t => t.status !== 'done').length,
      icon: CheckSquare, tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      trendLabel: taskTrend.label, trendDirection: taskTrend.direction,
    },
    {
      key: 'pending', label: 'Pending', value: tasks.filter(t => FILTERS.pending.match(t, now)).length,
      icon: Clock, tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      onClick: () => setActive('pending'),
    },
    {
      key: 'completed', label: 'Completed', value: tasks.filter(t => FILTERS.completed.match(t, now)).length,
      icon: CheckCircle2, tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      onClick: () => setActive('completed'),
    },
    {
      key: 'due', label: 'Due', value: tasks.filter(t => FILTERS.due.match(t, now)).length,
      icon: AlertTriangle, tint: 'bg-danger/10 text-danger',
      onClick: () => setActive('due'),
    },
  ];

  const matchedTasks = active ? tasks.filter(t => FILTERS[active].match(t, now)) : [];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 rounded-2xl border border-border/60 bg-surface shadow-sm divide-x divide-y sm:divide-y-0 divide-border/50 overflow-hidden">
        {tiles.map(tile => {
          const TrendIcon = tile.trendDirection === 'down' ? ArrowDown : ArrowUp;
          return (
            <div
              key={tile.key}
              onClick={tile.onClick}
              role={tile.onClick ? 'button' : undefined}
              tabIndex={tile.onClick ? 0 : undefined}
              onKeyDown={tile.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tile.onClick!(); } } : undefined}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 ${tile.onClick ? 'cursor-pointer hover:bg-surface-hover outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50' : ''}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${tile.tint}`}>
                <tile.icon size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-display font-medium text-text-muted truncate">{tile.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-display font-bold text-text tabular-nums">{tile.value}</span>
                  {tile.trendLabel && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-display font-semibold ${tile.trendDirection === 'down' ? 'text-danger' : 'text-success'}`}>
                      <TrendIcon size={9} strokeWidth={3} />
                      {tile.trendLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active ? FILTERS[active].label : ''}
        size="lg"
      >
        {matchedTasks.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">No tasks match this filter.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {matchedTasks.map(task => {
              const status = STATUS_CONFIG[task.status];
              const priority = PRIORITY_MAP[task.priority];
              return (
                <div key={task.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-surface-hover/50">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-text truncate">{task.title}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${status.badge}`}>{status.label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${priority.className}`}>{priority.label}</span>
                    </div>
                  </div>
                  {task.dueDate && (
                    <span className="text-xs font-medium text-text-muted shrink-0">
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
};
