import { useMemo } from 'react';
import { STATUS_LABEL } from '../tasks/taskDisplay';
import type { Task } from '../../api/task';

const STATUS_ORDER: Task['status'][] = ['done', 'pending_verification', 'in_progress', 'todo'];

const STATUS_FILL: Record<Task['status'], string> = {
  done: '#1d4ed8',
  pending_verification: '#3b82f6',
  in_progress: '#93c5fd',
  todo: '#e2e8f0', // slightly lighter for better contrast in a tight space
};

interface TaskStatusPieChartProps {
  tasks: Task[];
}

export const TaskStatusPieChart = ({ tasks }: TaskStatusPieChartProps) => {
  const { statusCounts, total, gradient, doneRate } = useMemo(() => {
    const counts = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<Task['status'], number>);

    tasks.forEach(task => {
      if (counts[task.status] !== undefined) counts[task.status]++;
    });

    const totalTasks = tasks.length;
    let currentPercent = 0;

    // Build the CSS conic-gradient string
    const gradientStops = STATUS_ORDER.map(status => {
      const count = counts[status];
      if (count === 0) return null;
      const percent = (count / totalTasks) * 100;
      const stop = `${STATUS_FILL[status]} ${currentPercent}% ${currentPercent + percent}%`;
      currentPercent += percent;
      return stop;
    }).filter(Boolean).join(', ');

    return {
      statusCounts: counts,
      total: totalTasks,
      gradient: gradientStops,
      doneRate: totalTasks > 0 ? Math.round((counts.done / totalTasks) * 100) : 0,
    };
  }, [tasks]);

  if (total === 0) {
    return <div className="text-xs text-slate-400 py-2">No tasks found</div>;
  }

  return (
    <div className="flex items-center gap-4 w-full">
      {/* CSS-only Donut Chart - Takes exactly 48x48 pixels with zero invisible padding */}
      <div
        className="size-12 rounded-full shrink-0 flex items-center justify-center"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        {/* Inner circle mask */}
        <div className="size-9 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
          <span className="font-display text-[10px] font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {doneRate}%
          </span>
        </div>
      </div>

      {/* Ultra-compact wrap legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
        {STATUS_ORDER.map((status) => {
          const count = statusCounts[status];
          if (count === 0) return null;

          return (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_FILL[status] }}
              />
              <span className="font-display text-xs font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                {count}
              </span>
              <span className="font-display text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none truncate">
                {STATUS_LABEL[status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};