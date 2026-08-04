import { MoreHorizontal, ArrowDown, ArrowUp, Target } from 'lucide-react';
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
  const changeClassName = change.direction === 'up' 
    ? 'bg-success/15 text-success border-success/20' 
    : 'bg-danger/15 text-danger border-danger/20';

  return (
    <div className="relative group rounded-2xl border border-border/60 bg-surface p-6 flex flex-col gap-1 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      
      {/* Decorative Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-2 z-10">
        <div className="flex gap-3 items-center">
          <div className="p-2 rounded-lg bg-surface-hover border border-border/50 text-text">
            <Target size={18} />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-text tracking-tight">Monthly Target</h3>
            <p className="text-xs font-display text-text-muted mt-0.5">Target you've set for this month</p>
          </div>
        </div>
        <button 
          type="button" 
          aria-label="More options" 
          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-all"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Chart Section */}
      <div className="relative h-[220px] mt-4 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="75%"
            outerRadius="100%"
            barSize={16}
            data={GAUGE_DATA(percent)}
            startAngle={210}
            endAngle={-30}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar 
              background={{ fill: 'var(--color-surface-hover)' }} 
              dataKey="value" 
              cornerRadius={12} 
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Central Chart Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-6">
          <span className="text-4xl font-display font-bold bg-gradient-to-br from-text to-text-muted bg-clip-text text-transparent">
            {percent}%
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-display font-semibold border ${changeClassName}`}>
            <ChangeIcon size={12} strokeWidth={3} />
            {change.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm font-display text-text-muted text-center px-4 -mt-2 z-10">
        {description}
      </p>

      {/* Footer Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-6 z-10">
        {stats.map(stat => {
          const TrendIcon = stat.direction === 'up' ? ArrowUp : ArrowDown;
          const trendClassName = stat.direction === 'up' ? 'text-success' : 'text-danger';
          
          return (
            <div 
              key={stat.label} 
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-hover/50 border border-border/40 hover:bg-surface-hover transition-colors"
            >
              <span className="text-xs font-display text-text-muted font-medium">{stat.label}</span>
              <span className="inline-flex items-center gap-1 text-base font-display font-bold text-text">
                {stat.value}
                <TrendIcon size={14} strokeWidth={2.5} className={trendClassName} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};