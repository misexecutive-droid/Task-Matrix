import { useMemo } from 'react';
import type { Task } from '../../api/task';

const DAY_MS = 24 * 60 * 60 * 1000;

// Colors updated for better contrast in a tight space
const WINDOWS = [
  { key: 'year', label: 'Yearly', ms: 365 * DAY_MS, fill: '#1e3a8a' }, // Deep Blue
  { key: 'month', label: 'Monthly', ms: 30 * DAY_MS, fill: '#3b82f6' }, // Blue
  { key: 'week', label: 'Weekly', ms: 7 * DAY_MS, fill: '#93c5fd' },   // Light Blue
  { key: 'day', label: 'Daily', ms: DAY_MS, fill: '#e2e8f0' },         // Slate
];

interface TaskActivityChartProps {
  tasks: Task[];
}

export const TaskActivityChart = ({ tasks }: TaskActivityChartProps) => {
  const { ringsData, totalTasks } = useMemo(() => {
    const now = Date.now();

    const data = WINDOWS.map((w, index) => {
      const inWindow = tasks.filter((t) => now - new Date(t.createdAt).getTime() <= w.ms);
      const completed = inWindow.filter((t) => t.status === 'done').length;
      const total = inWindow.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // SVG Math for a 270-degree (75%) partial ring
      const radius = 42 - index * 10; // Radii: 42, 32, 22, 12
      const circumference = 2 * Math.PI * radius;
      const trackLength = 0.75 * circumference;
      const fillLength = (percentage / 100) * trackLength;

      return {
        ...w,
        percentage,
        completed,
        total,
        radius,
        circumference,
        trackLength,
        fillLength,
      };
    });

    return { ringsData: data, totalTasks: tasks.length };
  }, [tasks]);

  if (totalTasks === 0) {
    return <div className="text-xs text-slate-400 py-2">No activity data</div>;
  }

  return (
    <div className="flex items-center gap-5 w-full">
      
      {/* 
        Native SVG Chart - Exactly 80x80 pixels.
        Rotated -90deg so the stroke starts at 12 o'clock and ends at 9 o'clock.
      */}
      <svg viewBox="0 0 100 100" className="size-20 shrink-0 transform -rotate-90">
        {ringsData.map((ring) => (
          <g key={ring.key}>
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={ring.radius}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeDasharray={`${ring.trackLength} ${ring.circumference}`}
            />
            {/* Completion Fill */}
            {ring.percentage > 0 && (
              <circle
                cx="50"
                cy="50"
                r={ring.radius}
                fill="none"
                strokeWidth="7"
                stroke={ring.fill}
                strokeLinecap="round"
                strokeDasharray={`${ring.fillLength} ${ring.circumference}`}
              />
            )}
          </g>
        ))}
      </svg>

      {/* Ultra-compact dense legend */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        {ringsData.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 tabular-nums">
                {item.completed}/{item.total}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums text-right w-8">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
};