import { useMemo, useState } from 'react';
import { Modal } from '../../components';
import { StatCard } from './StatCard';
import { STATUS_CONFIG, PRIORITY_MAP } from '../tasks/taskDisplay';
import { lastMonths, countInMonth, seriesInMonths, trendFrom } from './dashboardDisplay';
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
  sparkline: number[];
  trend: { direction: 'up' | 'down'; label: string };
  caption: string;
  onClick?: () => void;
}

export const KpiStrip = ({ tickets, tasks, isPending }: KpiStripProps) => {
  const [active, setActive] = useState<FilterKey | null>(null);
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);
  const months = useMemo(() => lastMonths(6), []);

  if (isPending) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[172px] rounded-2xl border border-border bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  const [prevMonth, curMonth] = months.slice(-2);
  const trendForDates = (dates: string[]) => {
    const previous = countInMonth(dates, prevMonth.year, prevMonth.month);
    const current = countInMonth(dates, curMonth.year, curMonth.month);
    const trend = trendFrom(current, previous);
    return { trend, caption: `${trend.direction} from ${previous}` };
  };

  const openTickets = tickets.filter(t => t.status !== 'CLOSED');
  const openTasks = tasks.filter(t => t.status !== 'done');
  const pendingTasks = tasks.filter(t => FILTERS.pending.match(t, now));
  const completedTasks = tasks.filter(t => FILTERS.completed.match(t, now));
  const dueTasks = tasks.filter(t => FILTERS.due.match(t, now));

  const tiles: Tile[] = [
    {
      key: 'openTickets', label: 'Open Tickets', value: openTickets.length,
      sparkline: seriesInMonths(openTickets.map(t => t.createdAt), months),
      ...trendForDates(openTickets.map(t => t.createdAt)),
    },
    {
      key: 'openTasks', label: 'Open Tasks', value: openTasks.length,
      sparkline: seriesInMonths(openTasks.map(t => t.createdAt), months),
      ...trendForDates(openTasks.map(t => t.createdAt)),
    },
    {
      key: 'pending', label: 'Pending', value: pendingTasks.length,
      sparkline: seriesInMonths(pendingTasks.map(t => t.createdAt), months),
      ...trendForDates(pendingTasks.map(t => t.createdAt)),
      onClick: () => setActive('pending'),
    },
    {
      key: 'completed', label: 'Completed', value: completedTasks.length,
      sparkline: seriesInMonths(completedTasks.map(t => t.createdAt), months),
      ...trendForDates(completedTasks.map(t => t.createdAt)),
      onClick: () => setActive('completed'),
    },
    {
      key: 'due', label: 'Due', value: dueTasks.length,
      sparkline: seriesInMonths(dueTasks.map(t => t.createdAt), months),
      ...trendForDates(dueTasks.map(t => t.createdAt)),
      onClick: () => setActive('due'),
    },
  ];

  const matchedTasks = active ? tasks.filter(t => FILTERS[active].match(t, now)) : [];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiles.map(tile => (
          <StatCard
            key={tile.key}
            label={tile.label}
            value={tile.value}
            trend={tile.trend}
            caption={tile.caption}
            sparkline={tile.sparkline}
            onClick={tile.onClick}
          />
        ))}
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
