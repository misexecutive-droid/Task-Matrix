import { Ticket as TicketIcon, CheckSquare, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../components';
import { StatTile } from './StatTile';

interface DashboardStatsGridProps {
  isPending: boolean;
  isAdmin: boolean;
  openTickets: number;
  openTasks: number;
  overdueCount: number;
  overdueTickets: number;
  overdueTasks: number;
  newTicketsThisWeek: number;
  newTasksThisWeek: number;
}

export const DashboardStatsGrid = ({
  isPending,
  isAdmin,
  openTickets,
  openTasks,
  overdueCount,
  overdueTickets,
  overdueTasks,
  newTicketsThisWeek,
  newTasksThisWeek,
}: DashboardStatsGridProps) => {
  if (isPending) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatTile
        icon={TicketIcon}
        label={isAdmin ? 'All tickets' : 'My open tickets'}
        value={openTickets}
        tint="bg-primary-500/10 text-primary-600 dark:text-primary-300"
        delta={{ text: `+${newTicketsThisWeek} this week`, tone: newTicketsThisWeek > 0 ? 'up' : 'neutral' }}
      />
      <StatTile
        icon={CheckSquare}
        label={isAdmin ? 'All tasks' : 'My open tasks'}
        value={openTasks}
        tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        delta={{ text: `+${newTasksThisWeek} this week`, tone: newTasksThisWeek > 0 ? 'up' : 'neutral' }}
      />
      <StatTile
        icon={AlertTriangle}
        label={isAdmin ? 'Overdue (org-wide)' : 'My overdue'}
        value={overdueCount}
        tint="bg-danger/10 text-danger"
        delta={overdueCount > 0
          ? { text: `${overdueTickets} tickets · ${overdueTasks} tasks`, tone: 'down' }
          : { text: 'All caught up', tone: 'up' }}
      />
    </div>
  );
};
