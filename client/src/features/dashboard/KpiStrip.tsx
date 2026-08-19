import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { StatCard } from './StatCard';
import { lastMonths, countInMonth, seriesInMonths, trendFrom } from './dashboardDisplay';
import type { Task } from '../../api/task';
import type { Ticket } from '../../api/ticket';

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
  const navigate = useNavigate();
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
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const dueTasks = tasks.filter(t => t.status !== 'done' && !!t.dueDate && new Date(t.dueDate).getTime() < now);

  // Every tile redirects straight to the real list, filtered where the target page's URL
  // filter support allows it — a dashboard number should always be one click from the actual
  // records behind it, not a dead end or a separate popup duplicating that page's own UI.
  const tiles: Tile[] = [
    {
      key: 'openTickets', label: 'Open Tickets', value: openTickets.length,
      sparkline: seriesInMonths(openTickets.map(t => t.createdAt), months),
      ...trendForDates(openTickets.map(t => t.createdAt)),
      onClick: () => navigate('/tickets'),
    },
    {
      key: 'openTasks', label: 'Open Delegations', value: openTasks.length,
      sparkline: seriesInMonths(openTasks.map(t => t.createdAt), months),
      ...trendForDates(openTasks.map(t => t.createdAt)),
      onClick: () => navigate('/tasks'),
    },
    {
      key: 'pending', label: 'Pending', value: pendingTasks.length,
      sparkline: seriesInMonths(pendingTasks.map(t => t.createdAt), months),
      ...trendForDates(pendingTasks.map(t => t.createdAt)),
      onClick: () => navigate('/tasks?status=todo'),
    },
    {
      key: 'completed', label: 'Completed', value: completedTasks.length,
      sparkline: seriesInMonths(completedTasks.map(t => t.createdAt), months),
      ...trendForDates(completedTasks.map(t => t.createdAt)),
      onClick: () => navigate('/tasks?status=done'),
    },
    {
      key: 'due', label: 'Due', value: dueTasks.length,
      sparkline: seriesInMonths(dueTasks.map(t => t.createdAt), months),
      ...trendForDates(dueTasks.map(t => t.createdAt)),
      onClick: () => navigate('/tasks'),
    },
  ];

  return (
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
  );
};
