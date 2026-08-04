import { Skeleton } from '../../components';
import { KpiStrip } from './KpiStrip';
import { TaskAnalyticsCard } from './TaskAnalyticsCard';
import { MonthlyTargetCard } from './MonthlyTargetCard';
import type { Trend } from './dashboardDisplay';
import type { Task } from '../../api/task';
import type { Ticket } from '../../api/ticket';

interface TargetStat {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

interface DashboardOverviewProps {
  isPending: boolean;
  tickets: Ticket[];
  tasks: Task[];
  monthlyData: { month: string; value: number }[];
  targetPercent: number;
  targetChange: Trend;
  targetDescription: string;
  targetStats: [TargetStat, TargetStat, TargetStat];
}

export const DashboardOverview = ({
  isPending,
  tickets,
  tasks,
  monthlyData,
  targetPercent,
  targetChange,
  targetDescription,
  targetStats,
}: DashboardOverviewProps) => {
  if (isPending) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-[84px] rounded-2xl border border-border bg-surface">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-full w-full min-h-[320px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <KpiStrip tickets={tickets} tasks={tasks} isPending={isPending} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TaskAnalyticsCard tasks={tasks} monthlyData={monthlyData} />
        </div>

        <MonthlyTargetCard
          percent={targetPercent}
          change={targetChange}
          description={targetDescription}
          stats={targetStats}
        />
      </div>
    </div>
  );
};
