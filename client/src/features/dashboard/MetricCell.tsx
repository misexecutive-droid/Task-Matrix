import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';

interface MetricCellProps {
  icon: LucideIcon;
  iconTint: string;
  label: string;
  value: number | string;
  linkTo?: string;
  linkPrefix?: string;
  linkLabel?: string;
  className?: string;
}

export const MetricCell = ({ 
  icon: Icon, 
  iconTint, 
  label, 
  value, 
  linkTo, 
  linkPrefix, 
  linkLabel, 
  className 
}: MetricCellProps) => (
  <div 
    className={`relative group flex flex-col rounded-2xl border border-border/60 bg-surface p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden ${className ?? ''}`}
  >
    {/* Decorative Background Glow */}
    <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

    {/* Header: Label (Left) + Icon (Right) */}
    <div className="relative z-10 flex items-start justify-between gap-3 mb-2">
      <h3 className="text-sm font-display font-medium text-text-muted mt-1">
        {label}
      </h3>
      <div className={`p-2 rounded-xl border border-border/50 bg-surface-hover flex items-center justify-center shadow-sm shrink-0 ${iconTint}`}>
        <Icon size={18} />
      </div>
    </div>

    {/* Primary Value */}
    <div className="relative z-10 mt-1">
      <p className="text-3xl font-display font-bold text-text tracking-tight leading-none">
        {value}
      </p>
    </div>

    {/* Optional Footer Link */}
    {linkTo && linkLabel && (
      <div className="relative z-10 mt-auto pt-4">
        <p className="text-xs font-display text-text-muted">
          {linkPrefix}{' '}
          <Link 
            to={linkTo} 
            className="font-medium text-primary-500 hover:text-primary-600 transition-colors hover:underline underline-offset-4 decoration-primary-500/30 hover:decoration-primary-500"
          >
            {linkLabel}
          </Link>
        </p>
      </div>
    )}
  </div>
);