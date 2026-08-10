import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  trend?: { direction: 'up' | 'down'; label: string };
  icon?: LucideIcon;
  iconTint?: string;
  caption?: string;
  /** Accepted but intentionally not rendered — the reference design has no sparkline in these cards. */
  sparkline?: number[];
  onClick?: () => void;
}

const TREND_TEXT = {
  up: 'text-success',
  down: 'text-danger',
} as const;

export const StatCard = ({ label, value, trend, icon: Icon, iconTint, caption, onClick }: StatCardProps) => {
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`relative flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow duration-200 hover:shadow-md ${onClick ? 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50' : ''}`}
    >
      {/* Value */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-4xl font-extrabold tracking-tight text-primary-700 leading-none">
          {value}
        </p>
        {Icon && <Icon size={16} className={iconTint ?? 'text-text-muted'} />}
      </div>

      {/* Label + inline trend/caption */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
        <span className="font-display text-[13px] text-text-secondary">
          {label}
        </span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-display font-bold ${TREND_TEXT[trend.direction]}`}>
            <TrendIcon size={12} strokeWidth={2.75} />
            {trend.label}
          </span>
        )}
        {!trend && caption && (
          <span className="font-display text-xs text-text-muted">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
};
