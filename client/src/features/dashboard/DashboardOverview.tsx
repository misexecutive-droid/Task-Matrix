import { Ticket as TicketIcon, CheckSquare } from 'lucide-react';
import { Skeleton } from '../../components';
import { StatCard } from './StatCard';
import { MonthlyTargetCard } from './MonthlyTargetCard';
import { MonthlySalesChart } from './MonthlySalesChart';
import type { Trend } from './dashboardDisplay';

interface TargetStat {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

interface DashboardOverviewProps {
  isPending: boolean;
  openTickets: number;
  openTasks: number;
  ticketTrend: Trend;
  taskTrend: Trend;
  monthlyData: { month: string; value: number }[];
  targetPercent: number;
  targetChange: Trend;
  targetDescription: string;
  targetStats: [TargetStat, TargetStat, TargetStat];
}

export const DashboardOverview = ({
  isPending,
  openTickets,
  openTasks,
  ticketTrend,
  taskTrend,
  monthlyData,
  targetPercent,
  targetChange,
  targetDescription,
  targetStats,
}: DashboardOverviewProps) => {
  if (isPending) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Skeleton className="h-full w-full min-h-[420px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <StatCard
            icon={TicketIcon}
            iconTint="bg-primary-500/10 text-primary-600 dark:text-primary-300"
            label="Open Tickets"
            value={openTickets}
            trend={ticketTrend}
          />
          <StatCard
            icon={CheckSquare}
            iconTint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            label="Open Tasks"
            value={openTasks}
            trend={taskTrend}
          />
        </div>

        <MonthlySalesChart data={monthlyData} />
      </div>

      <MonthlyTargetCard
        percent={targetPercent}
        change={targetChange}
        description={targetDescription}
        stats={targetStats}
      />
    </div>
  );
};
