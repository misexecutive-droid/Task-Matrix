import { useMemo } from 'react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Task } from '../../api/task';

const DAY_MS = 24 * 60 * 60 * 1000;

// Trailing lookback windows — each axis answers "of the tasks created in the
// last <window>, how many are done vs. still open." Windows nest (day inside
// week inside month inside year) so outer axes read larger by construction —
// that's the point: it shows backlog build-up at a glance, not a per-period rate.
const WINDOWS = [
  { key: 'day', label: 'Day', ms: DAY_MS },
  { key: 'week', label: 'Week', ms: 7 * DAY_MS },
  { key: 'month', label: 'Month', ms: 30 * DAY_MS },
  { key: 'year', label: 'Year', ms: 365 * DAY_MS },
];

interface RadarTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

const RadarTooltip = ({ active, payload, label }: RadarTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-surface/85 backdrop-blur-md px-4 py-3 shadow-lg flex flex-col gap-1.5">
      <p className="text-xs font-display font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-sm font-bold text-text">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface TaskActivityRadarChartProps {
  tasks: Task[];
}

export const TaskActivityRadarChart = ({ tasks }: TaskActivityRadarChartProps) => {
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);
  const data = WINDOWS.map(w => {
    const inWindow = tasks.filter(t => now - new Date(t.createdAt).getTime() <= w.ms);
    return {
      axis: w.label,
      Completed: inWindow.filter(t => t.status === 'done').length,
      Pending: inWindow.filter(t => t.status !== 'done').length,
    };
  });

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="var(--color-border)" strokeOpacity={0.6} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }} />
          <PolarRadiusAxis tick={{ fill: 'var(--color-text-light)', fontSize: 10 }} axisLine={false} />
          <Radar name="Pending" dataKey="Pending" stroke="var(--color-primary-500)" fill="var(--color-primary-500)" fillOpacity={0.18} strokeWidth={2} />
          <Radar name="Completed" dataKey="Completed" stroke="var(--color-status-done)" fill="var(--color-status-done)" fillOpacity={0.18} strokeWidth={2} />
          <Tooltip content={<RadarTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
            iconType="circle"
            iconSize={8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
