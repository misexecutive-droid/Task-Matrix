import { useState } from 'react';
import { PieChart as PieChartIcon, Activity as ActivityIcon, TrendingUp } from 'lucide-react';
import { TaskStatusPieChart } from './TaskStatusPieChart';
import { TaskActivityChart } from './TaskActivityChart';
import { TaskTrendChart } from './TaskTrendChart';
import type { Task } from '../../api/task';

type TabKey = 'status' | 'activity' | 'trend';

const TABS: { key: TabKey; label: string; icon: typeof PieChartIcon; description: string }[] = [
  { key: 'status', label: 'Status', icon: PieChartIcon, description: 'Task breakdown by current status' },
  { key: 'activity', label: 'Activity', icon: ActivityIcon, description: 'Pending vs. completed by lookback window' },
  { key: 'trend', label: 'Trend', icon: TrendingUp, description: 'Combined ticket + task volume over time' },
];

interface TaskAnalyticsCardProps {
  tasks: Task[];
  monthlyData: { month: string; value: number }[];
}

export const TaskAnalyticsCard = ({ tasks, monthlyData }: TaskAnalyticsCardProps) => {
  const [active, setActive] = useState<TabKey>('status');
  const activeTab = TABS.find(t => t.key === active)!;

  return (
    <div className="relative group rounded-2xl border border-border/60 bg-surface p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

      {/* Decorative Background Glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex gap-3 items-center">
          <div className="p-2 rounded-lg bg-surface-hover border border-border/50 text-text">
            <activeTab.icon size={18} />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-text tracking-tight">Task Analytics</h3>
            <p className="text-xs font-display text-text-muted mt-0.5">{activeTab.description}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-surface-hover/80 border border-border rounded-lg">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
                active === tab.key
                  ? 'bg-surface text-text shadow-sm ring-1 ring-border/50'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-active/50'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Chart */}
      <div className="relative z-10 flex items-center">
        {active === 'status' && <TaskStatusPieChart tasks={tasks} />}
        {active === 'activity' && <TaskActivityChart tasks={tasks} />}
        {active === 'trend' && <TaskTrendChart data={monthlyData} />}
      </div>
    </div>
  );
};
