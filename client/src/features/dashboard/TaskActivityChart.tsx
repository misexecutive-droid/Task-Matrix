import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Task } from '../../api/task';

const DAY_MS = 24 * 60 * 60 * 1000;

// Configured from outermost ring to innermost ring
const WINDOWS = [
  { key: 'year', label: 'Yearly', ms: 365 * DAY_MS, fill: '#282f6b' },    // Outermost - Deep Navy
  { key: 'month', label: 'Monthly', ms: 30 * DAY_MS, fill: '#3b52d4' },   // Middle Outer - Indigo
  { key: 'week', label: 'Weekly', ms: 7 * DAY_MS, fill: '#4f72ff' },     // Middle Inner - Royal Blue
  { key: 'day', label: 'Daily', ms: DAY_MS, fill: '#a0c0ff' },         // Innermost - Soft Light Blue
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; completed: number; total: number; percentage: number; fill: string } }>;
}

const SliceTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 shadow-lg ring-1 ring-black/5">
      <div className="flex items-center gap-2 mb-1">
        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: data.fill }} />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
          {data.name} Activity
        </span>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-300">
        <span className="font-bold">{data.percentage}%</span> completed ({data.completed}/{data.total} tasks)
      </div>
    </div>
  );
};

interface TaskActivityChartProps {
  tasks: Task[];
}

export const TaskActivityChart = ({ tasks }: TaskActivityChartProps) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { ringsData, totalTasks } = useMemo(() => {
    const now = Date.now();

    const data = WINDOWS.map(w => {
      const inWindow = tasks.filter(t => now - new Date(t.createdAt).getTime() <= w.ms);
      const completed = inWindow.filter(t => t.status === 'done').length;
      const total = inWindow.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        key: w.key,
        name: w.label,
        percentage,
        completed,
        total,
        fill: w.fill,
      };
    });

    return {
      ringsData: data,
      totalTasks: tasks.length,
    };
  }, [tasks]);

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] w-full max-w-lg mx-auto text-center">
        <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No activity data</p>
        <p className="text-xs text-slate-500 mt-1">Check back when tasks are created.</p>
      </div>
    );
  }

  // Define radius dimensions for the 4 concentric rings (outermost to innermost)
  const ringRadii = [
    { inner: '82%', outer: '98%' },
    { inner: '65%', outer: '80%' },
    { inner: '48%', outer: '63%' },
    { inner: '31%', outer: '46%' },
  ];

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
        
        {/* Left Side: Legend (2 cols on sm screen) */}
        <div className="sm:col-span-2 flex flex-col gap-3">
          {ringsData.map((item) => {
            const isHovered = hoveredKey === item.key;
            return (
              <div
                key={item.key}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="size-3 rounded-full shrink-0 transition-transform duration-200"
                    style={{
                      backgroundColor: item.fill,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums ml-2">
                  {item.percentage}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Side: Concentric Partial Arc Donut (3 cols on sm screen) */}
        <div className="sm:col-span-3 relative w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {ringsData.map((ring, index) => {
                const radii = ringRadii[index];
                const isHovered = hoveredKey === ring.key;
                const isOtherHovered = hoveredKey !== null && !isHovered;

                // Data setup: 1 slice for filled arc (calculated from percentage sweep up to 270 deg), 1 slice for gray track background
                const value = Math.max(ring.percentage, 1);
                const remaining = 100 - value;

                return (
                  <Pie
                    key={ring.key}
                    data={[
                      { name: ring.name, value: value, payload: ring },
                      { name: 'Remaining', value: remaining, payload: { fill: '#f1f5f9' } },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-180} // 270-degree partial sweep matching image
                    innerRadius={radii.inner}
                    outerRadius={radii.outer}
                    stroke="none"
                    animationDuration={800}
                  >
                    {/* Filled portion */}
                    <Cell
                      fill={ring.fill}
                      fillOpacity={isOtherHovered ? 0.35 : 1}
                      className="transition-all duration-200 cursor-pointer outline-none"
                      onMouseEnter={() => setHoveredKey(ring.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    />
                    {/* Track portion */}
                    <Cell fill="#f8fafc" className="outline-none" />
                  </Pie>
                );
              })}
              <Tooltip content={<SliceTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
};