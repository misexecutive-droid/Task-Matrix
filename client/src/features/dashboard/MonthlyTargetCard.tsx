import { MoreHorizontal, ArrowDown, ArrowUp } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { Trend } from './dashboardDisplay';

interface FooterStat {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

interface MonthlyTargetCardProps {
  percent: number;
  change: Trend;
  description: string;
  stats: [FooterStat, FooterStat, FooterStat];
}

const GAUGE_DATA = (percent: number) => [{ value: percent, fill: 'var(--color-primary-500)' }];

export const MonthlyTargetCard = ({ percent, change, description, stats }: MonthlyTargetCardProps) => {
  const ChangeIcon = change.direction === 'up' ? ArrowUp : ArrowDown;
  const changeClassName = change.direction === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger';

  return (
  <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-1">
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="text-base font-display font-semibold text-text">Monthly Target</h3>
        <p className="text-xs font-display text-text-muted mt-1">Target you've set for this month</p>
      </div>
      <button type="button" aria-label="More options" className="text-text-muted hover:text-text-secondary transition-colors">
        <MoreHorizontal size={18} />
      </button>
    </div>

    <div className="relative h-[200px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="75%"
          outerRadius="100%"
          barSize={14}
          data={GAUGE_DATA(percent)}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: 'var(--color-surface-hover)' }} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <span className="text-3xl font-display font-bold text-text">{percent}%</span>
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-display font-medium ${changeClassName}`}>
          <ChangeIcon size={12} />
          {change.label}
        </span>
      </div>
    </div>

    <p className="text-sm font-display text-text-muted text-center px-2">{description}</p>

    <div className="grid grid-cols-3 mt-5 rounded-xl bg-surface-hover overflow-hidden divide-x divide-border">
      {stats.map(stat => {
        const TrendIcon = stat.direction === 'up' ? ArrowUp : ArrowDown;
        const trendClassName = stat.direction === 'up' ? 'text-success' : 'text-danger';
        return (
          <div key={stat.label} className="flex flex-col items-center gap-1.5 py-3">
            <span className="text-xs font-display text-text-muted">{stat.label}</span>
            <span className={`inline-flex items-center gap-0.5 text-sm font-display font-semibold text-text`}>
              {stat.value}
              <TrendIcon size={12} className={trendClassName} />
            </span>
          </div>
        );
      })}
    </div>
  </div>
  );
};
