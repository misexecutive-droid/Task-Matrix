interface RoleSwitcherOption {
  value: string;
  label: string;
}

interface RoleSwitcherProps {
  options: RoleSwitcherOption[];
  value: string;
  onChange: (value: string) => void;
}

export const RoleSwitcher = ({ options, value, onChange }: RoleSwitcherProps) => (
  <div
    role="tablist"
    aria-label="View as role"
    className="hidden md:inline-flex items-center gap-0.5 p-1 rounded-full bg-surface-hover/60"
  >
    {options.map((option) => {
      const isActive = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(option.value)}
          className={[
            'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
            isActive
              ? 'bg-primary-700 text-white shadow-sm shadow-primary-700/20'
              : 'text-text-secondary hover:text-text hover:bg-surface',
          ].join(' ')}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
