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

export const MetricCell = ({ icon: Icon, iconTint, label, value, linkTo, linkPrefix, linkLabel, className }: MetricCellProps) => (
  <div className={`flex flex-col gap-3 p-5 ${className ?? ''}`}>
    <h3 className="text-sm font-display font-semibold text-text">{label}</h3>
    <div className={`flex items-center justify-center size-10 rounded-md shrink-0 ${iconTint}`}>
      <Icon size={18} />
    </div>
    <p className="text-3xl font-display font-bold text-text leading-none">{value}</p>
    {linkTo && linkLabel && (
      <p className="text-xs font-display text-text-muted">
        {linkPrefix}{' '}
        <Link to={linkTo} className="text-primary-500 hover:underline">
          {linkLabel}
        </Link>
      </p>
    )}
  </div>
);
