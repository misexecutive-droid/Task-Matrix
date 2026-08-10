interface SidebarSubNavButtonProps {
  label: string;
  badge?: string | number;
  isActive?: boolean;
  onClick?: () => void;
}

export const SidebarSubNavButton = ({
  label,
  badge,
  isActive = false,
  onClick,
}: SidebarSubNavButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    className={[
      'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-display transition-colors duration-200 cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
      isActive
        ? 'bg-primary-50 text-primary-700 font-semibold'
        : 'text-text-secondary font-medium hover:bg-surface-hover hover:text-text',
    ].join(' ')}
  >
    <span className="flex-1 min-w-0 truncate text-left leading-none">{label}</span>

    {badge != null && (
      <span
        className={[
          'shrink-0 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums leading-none',
          isActive ? 'bg-primary-700/10 text-primary-700' : 'bg-surface-hover text-text-muted',
        ].join(' ')}
      >
        {badge}
      </span>
    )}
  </button>
);
