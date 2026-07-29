import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconTint: string;
  label: string;
  value: number | string;
  trend: { direction: 'up' | 'down'; label: string };
}

const TREND_STYLE = {
  up: { icon: ArrowUp, className: 'bg-success/10 text-success' },
  down: { icon: ArrowDown, className: 'bg-danger/10 text-danger' },
} as const;

export const StatCard = ({ icon: Icon, iconTint, label, value, trend }: StatCardProps) => {
  const { icon: TrendIcon, className: trendClassName } = TREND_STYLE[trend.direction];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
      <div className={`flex items-center justify-center size-12 rounded-xl shrink-0 ${iconTint}`}>
        <Icon size={22} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-display text-text-muted">{label}</span>
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-display font-medium ${trendClassName}`}>
            <TrendIcon size={12} />
            {trend.label}
          </span>
        </div>
        <p className="text-3xl font-display font-bold text-text leading-none">{value}</p>
      </div>
    </div>
  );
};
