import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  trend?: { direction: 'up' | 'down'; label: string };
  icon?: LucideIcon;
  iconTint?: string;
  caption?: string;
  sparkline?: number[];
  onClick?: () => void;
}

const TREND_TEXT = {
  up: 'text-success',
  down: 'text-danger',
} as const;

const SPARK_WIDTH = 96;
const SPARK_HEIGHT = 32;

const MiniSparkline = ({ values }: { values: number[] }) => {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * SPARK_WIDTH;
      const y = SPARK_HEIGHT - 2 - ((v - min) / range) * (SPARK_HEIGHT - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      className="shrink-0"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary-500)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const StatCard = ({ label, value, trend, icon: Icon, iconTint, caption, sparkline, onClick }: StatCardProps) => {
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : ArrowDownRight;
  const hasFooter = !!trend || !!caption;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`relative group flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden ${onClick ? 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50' : ''}`}
    >
      {/* Decorative Background Glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      {/* Label row */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="font-display text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        {Icon && <Icon size={14} className={iconTint ?? 'text-text-muted'} />}
      </div>

      {/* Value + sparkline row */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <p className="font-display text-3xl font-bold tracking-tight text-text">
          {value}
        </p>
        {sparkline && sparkline.length > 1 && <MiniSparkline values={sparkline} />}
      </div>

      {/* Footer: trend pill + caption */}
      {hasFooter && (
        <div className="relative z-10 flex items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-display font-semibold bg-surface-hover border border-border/50 ${TREND_TEXT[trend.direction]}`}>
              <TrendIcon size={11} strokeWidth={2.5} />
              {trend.label}
            </span>
          )}
          {caption && (
            <span className="font-display text-xs text-text-muted">
              {caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
