import { useMemo } from 'react';
import { ArrowDown, ArrowUp, Target } from 'lucide-react';
import type { CompliancePeriod, Trend } from './dashboardDisplay';

export interface FooterStat {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

const PERIOD_OPTIONS: { key: CompliancePeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

interface MonthlyTargetCardProps {
  percent: number;
  change: Trend;
  description: string;
  stats: [FooterStat, FooterStat, FooterStat];
  period: CompliancePeriod;
  onPeriodChange: (period: CompliancePeriod) => void;
}

export const MonthlyTargetCard = ({ percent, change, description, stats, period, onPeriodChange }: MonthlyTargetCardProps) => {
  const ChangeIcon = change.direction === 'up' ? ArrowUp : ArrowDown;
  const changeClassName = change.direction === 'up'
    ? 'bg-success/10 text-success'
    : 'bg-danger/10 text-danger';

  // Calculate SVG arc properties for a 240-degree gauge (leaving a 120-degree gap at the bottom)
  const { trackLength, fillLength, circumference } = useMemo(() => {
    const radius = 40;
    const circ = 2 * Math.PI * radius;
    const track = (240 / 360) * circ;
    const fill = (Math.min(Math.max(percent, 0), 100) / 100) * track;
    
    return {
      circumference: circ,
      trackLength: track,
      fillLength: fill
    };
  }, [percent]);

  return (
    <div className="relative group rounded-xl border border-border/60 bg-surface p-6 flex flex-col gap-1 hover:border-primary-300 transition-colors duration-300 overflow-hidden">
      
      {/* Decorative Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-2 z-10">
        <div className="flex gap-3 items-center">
          <div className="p-2 rounded-lg bg-surface-hover border border-border/50 text-text">
            <Target size={18} />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-text tracking-tight">Target</h3>
            <p className="text-xs font-display text-text-muted mt-0.5">Checklist completion rate</p>
          </div>
        </div>

        {/* Period selector — day/week/month/year, matching the granularities the server's
            compliance report already aggregates by. */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-hover border border-border/50">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onPeriodChange(opt.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-display font-medium transition-colors cursor-pointer ${
                period === opt.key
                  ? 'bg-surface text-text border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body — gauge on the left, description + stats filling the rest of the width on the
          right. This card used to be a 1/3-width column with everything stacked and centered;
          now that it's the only card in the row, that layout left huge empty margins either
          side of a narrow vertical stack, so it's a horizontal split instead. */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 mt-4">
        <div className="relative h-[200px] w-[200px] shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--color-surface-hover, #eef0f3)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${trackLength} ${circumference}`}
              transform="rotate(150 50 50)"
            />
            {/* Foreground Progress Arc */}
            {percent > 0 && (
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-primary-500, #2a66a8)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${fillLength} ${circumference}`}
                transform="rotate(150 50 50)"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>

          {/* Central Chart Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-6">
            <span className="text-4xl font-display font-bold bg-gradient-to-br from-text to-text-muted bg-clip-text text-transparent">
              {percent}%
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-display font-semibold ${changeClassName}`}>
              <ChangeIcon size={12} strokeWidth={3} />
              {change.label}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col gap-4">
          <p className="text-sm font-display text-text-muted text-center lg:text-left">
            {description}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {stats.map(stat => {
              const TrendIcon = stat.direction === 'up' ? ArrowUp : ArrowDown;
              const trendClassName = stat.direction === 'up' ? 'text-success' : 'text-danger';

              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 p-4 rounded-lg bg-surface-hover/50 border border-border/40 hover:bg-surface-hover transition-colors"
                >
                  <span className="text-xs font-display text-text-muted font-medium">{stat.label}</span>
                  <span className="inline-flex items-center gap-1 text-lg font-display font-bold text-text">
                    {stat.value}
                    <TrendIcon size={14} strokeWidth={2.5} className={trendClassName} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};