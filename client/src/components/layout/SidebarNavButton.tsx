import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

interface SidebarNavButtonProps {
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  comingSoon?: boolean;
  isActive?: boolean;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

export const SidebarNavButton = ({
  icon: Icon,
  label,
  badge,
  comingSoon = false,
  isActive = false,
  isCollapsed = false,
  hasChildren = false,
  isExpanded = false,
  onClick,
}: SidebarNavButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    aria-current={isActive ? 'page' : undefined}
    aria-expanded={hasChildren ? isExpanded : undefined}
    className={[
      'group/nav relative flex w-full items-center gap-3 rounded-xl text-sm font-display font-semibold transition-all duration-200 ease-out cursor-pointer',
      'px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
      isCollapsed ? 'justify-center px-0' : 'justify-start',
      isActive
        ? 'bg-primary-700 text-white shadow-sm shadow-primary-700/20'
        : 'text-text-secondary hover:bg-surface-hover hover:text-text active:scale-[0.98]',
    ].join(' ')}
  >
    <Icon
      size={17}
      strokeWidth={isActive ? 2 : 1.75}
      className={[
        'shrink-0 transition-transform duration-200 group-hover/nav:scale-105',
        isActive ? 'text-white' : 'text-text-muted group-hover/nav:text-text-secondary',
      ].join(' ')}
    />

    {!isCollapsed && (
      <>
        <span className="flex-1 min-w-0 truncate text-left leading-none">{label}</span>

        {comingSoon ? (
          <span className="shrink-0 rounded-full border border-border-hover/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-light">
            Soon
          </span>
        ) : badge != null ? (
          <span
            className={[
              'shrink-0 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums leading-none',
              isActive ? 'bg-white/20 text-white' : 'bg-surface-hover text-text-muted',
            ].join(' ')}
          >
            {badge}
          </span>
        ) : null}

        {hasChildren && (
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className={[
              'shrink-0 transition-transform duration-200',
              isExpanded ? 'rotate-180' : 'rotate-0',
              isActive ? 'text-white' : 'text-text-light',
            ].join(' ')}
          />
        )}
      </>
    )}

    {/* Collapsed-rail active indicator — a thin gold pip, so the active item still reads even
        when the label/badge are hidden in icon-only mode. */}
    {isCollapsed && isActive && (
      <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-coral-500" />
    )}
  </button>
);
