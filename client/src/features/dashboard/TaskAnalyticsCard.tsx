import { PieChart as PieChartIcon, Activity as ActivityIcon, TrendingUp } from 'lucide-react';
import { TaskStatusPieChart } from './TaskStatusPieChart';
import { TaskActivityChart } from './TaskActivityChart';
import { TaskTrendChart } from './TaskTrendChart';
import type { Task } from '../../api/task';

const SECTIONS = [
  { key: 'status', label: 'Status', icon: PieChartIcon, description: 'Task breakdown by current status' },
  { key: 'activity', label: 'Activity', icon: ActivityIcon, description: 'Pending vs. completed by lookback window' },
  { key: 'trend', label: 'Trend', icon: TrendingUp, description: 'Combined ticket + task volume over time' },
] as const;

interface TaskAnalyticsCardProps {
  tasks: Task[];
  monthlyData: { month: string; value: number }[];
}

export const TaskAnalyticsCard = ({ tasks, monthlyData }: TaskAnalyticsCardProps) => (
  <div className="relative group rounded-2xl border border-border/60 bg-surface p-6 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

    {/* Decorative Background Glow */}
    <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

    {/* Header */}
    <div className="relative z-10">
      <h3 className="text-lg font-display font-semibold text-text tracking-tight">Task Analytics</h3>
      <p className="text-xs font-display text-text-muted mt-0.5">Status, activity, and volume trends across every task.</p>
    </div>

    {/* Stacked Charts */}
    <div className="relative z-10 flex flex-col gap-6">
      {SECTIONS.map((section, i) => (
        <div key={section.key} className={i > 0 ? 'pt-6 border-t border-border/50' : ''}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-surface-hover border border-border/50 text-text shrink-0">
              <section.icon size={15} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-display font-semibold text-text">{section.label}</h4>
              <p className="text-xs font-display text-text-muted truncate">{section.description}</p>
            </div>
          </div>

          {section.key === 'status' && <TaskStatusPieChart tasks={tasks} />}
          {section.key === 'activity' && <TaskActivityChart tasks={tasks} />}
          {section.key === 'trend' && <TaskTrendChart data={monthlyData} />}
        </div>
      ))}
    </div>
  </div>
);
