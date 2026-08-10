import { TaskStatusPieChart } from './TaskStatusPieChart';
import type { Task } from '../../api/task';

interface TaskAnalyticsCardProps {
  tasks: Task[];
}

export const TaskAnalyticsCard = ({ tasks }: TaskAnalyticsCardProps) => (
  <div className="relative group rounded-2xl border border-border/60 bg-surface p-5 flex flex-col gap-3 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

    <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

    <div className="relative z-10">
      <h3 className="text-lg font-display font-semibold text-text tracking-tight">Task Analytics</h3>
      <p className="text-xs font-display text-text-muted mt-0.5">Task breakdown by current status</p>
    </div>

    <div className="relative z-10">
      <TaskStatusPieChart tasks={tasks} />
    </div>
  </div>
);
