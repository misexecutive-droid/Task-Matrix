import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';

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

const TREND_STYLE = {
  up: 'bg-success/15 text-success border-success/20',
  down: 'bg-danger/15 text-danger border-danger/20',
} as const;

export const StatCard = ({ label, value, trend, icon: Icon, iconTint, caption, sparkline, onClick }: StatCardProps) => {
  const sparkMax = sparkline && sparkline.length > 0 ? Math.max(...sparkline, 1) : 0;
  const hasFooter = !!caption || !!(sparkline && sparkline.length > 0);
  const TrendIcon = trend?.direction === 'up' ? ArrowUp : ArrowDown;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`relative group flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden ${onClick ? 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50' : ''}`}
    >

      {/* Decorative Background Glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-xl border border-border/50 bg-surface-hover flex items-center justify-center shadow-sm ${iconTint ?? 'text-text'}`}>
              <Icon size={16} />
            </div>
          )}
          <span className="font-display text-sm font-medium text-text-muted">
            {label}
          </span>
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-display font-semibold border ${TREND_STYLE[trend.direction]}`}>
            <TrendIcon size={12} strokeWidth={3} />
            {trend.label}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10 mt-1">
        <p className="font-display text-4xl font-bold tracking-tight text-text">
          {value}
        </p>
      </div>

      {/* Footer (Caption & Sparkline) */}
      {hasFooter && (
        <div className="relative z-10 flex items-end justify-between gap-4 mt-2 min-h-[48px]">
          {caption ? (
            <span className="font-display text-xs font-medium text-text-muted max-w-[50%] leading-relaxed pb-1">
              {caption}
            </span>
          ) : (
            <div /> // Spacer if no caption
          )}

          {sparkline && sparkline.length > 0 && (
            <div className="flex items-end gap-1 h-12 flex-1 max-w-[140px] ml-auto">
              {sparkline.map((v, i) => {
                const heightPercentage = Math.max((v / sparkMax) * 100, 8);
                const isHighlight = i === sparkline.length - 1 || v / sparkMax >= 0.8;

                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-transform duration-300 group-hover:scale-y-110 origin-bottom ${
                      isHighlight ? 'bg-primary-500' : 'bg-primary-500/20'
                    }`}
                    style={{ height: `${heightPercentage}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};