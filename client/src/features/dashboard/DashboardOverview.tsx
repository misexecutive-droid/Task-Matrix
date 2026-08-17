import { Skeleton } from '../../components';
import { KpiStrip } from './KpiStrip';
import type { Task } from '../../api/task';
import type { Ticket } from '../../api/ticket';

interface DashboardOverviewProps {
  isPending: boolean;
  tickets: Ticket[];
  tasks: Task[];
}

export const DashboardOverview = ({ isPending, tickets, tasks }: DashboardOverviewProps) => {
  if (isPending) {
    return (
      <div className="h-[84px] rounded-xl border border-border bg-surface">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return <KpiStrip tickets={tickets} tasks={tasks} isPending={isPending} />;
};
