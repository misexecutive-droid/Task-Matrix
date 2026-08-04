import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { STATUS_LABEL } from '../tasks/taskDisplay';
import type { Task } from '../../api/task';

const STATUS_ORDER: Task['status'][] = ['done', 'pending_verification', 'in_progress', 'todo'];

// Modern, high-contrast monochrome/blue palette based on the UI reference image
const STATUS_FILL: Record<Task['status'], string> = {
  done: '#1d4ed8',                  // Deep Royal Blue
  pending_verification: '#3b82f6',  // Bright Blue
  in_progress: '#93c5fd',           // Soft Sky Blue
  todo: '#cbd5e1',                  // Neutral Slate Gray
};

interface SliceTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

const SliceTooltip = ({ active, payload }: SliceTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: dataPayload } = payload[0];

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 shadow-lg ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: dataPayload.color }}
        />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{name}:</span>
        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
};

interface TaskStatusPieChartProps {
  tasks: Task[];
}

export const TaskStatusPieChart = ({ tasks }: TaskStatusPieChartProps) => {
  const [hoveredStatus, setHoveredStatus] = useState<Task['status'] | null>(null);

  const { chartData, statusCounts, total, doneRate } = useMemo(() => {
    const counts = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<Task['status'], number>);

    tasks.forEach(task => {
      if (counts[task.status] !== undefined) {
        counts[task.status] += 1;
      }
    });

    const data = STATUS_ORDER
      .map(status => ({
        key: status,
        name: STATUS_LABEL[status],
        value: counts[status],
        color: STATUS_FILL[status],
      }))
      .filter(d => d.value > 0);

    return {
      chartData: data,
      statusCounts: counts,
      total: tasks.length,
      doneRate: tasks.length > 0 ? Math.round((counts.done / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] w-full max-w-lg mx-auto text-center">
        <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No tasks found</p>
        <p className="text-xs text-slate-500 mt-1">Add tasks to see progress metrics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto">

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
          {doneRate}%
        </span>
        <span className="text-xs font-medium text-slate-500">
          completed ({statusCounts.done}/{total})
        </span>
      </div>

      {/* Dome Arc Gauge */}
      <div className="relative h-[100px] shrink-0 my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="#ffffff"
              strokeWidth={2}
              animationDuration={800}
            >
              {chartData.map((entry) => {
                const isHovered = hoveredStatus === entry.key;
                const isOtherHovered = hoveredStatus !== null && !isHovered;

                return (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    fillOpacity={isOtherHovered ? 0.35 : 1}
                    className="transition-all duration-200 outline-none cursor-pointer"
                    onMouseEnter={() => setHoveredStatus(entry.key)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                );
              })}
            </Pie>
            <Tooltip
              content={<SliceTooltip />}
              cursor={{ fill: 'transparent' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {STATUS_ORDER.map((status) => {
          const count = statusCounts[status];
          const isSelected = hoveredStatus === status;

          return (
            <div
              key={status}
              onMouseEnter={() => setHoveredStatus(status)}
              onMouseLeave={() => setHoveredStatus(null)}
              className={`flex flex-col gap-0.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSelected ? 'bg-slate-50 dark:bg-slate-800/60' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: STATUS_FILL[status],
                    transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
                <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {count}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {STATUS_LABEL[status]}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};