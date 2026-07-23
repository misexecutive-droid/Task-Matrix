import { CheckSquare } from "lucide-react";
import { NavLink } from "react-router";

const LINKS = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/projects', label: 'Projects' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/settings', label: 'Settings' },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t border-border/60 mt-auto transition-colors"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-x-6 gap-y-4">
        
        {/* Brand Anchor */}
        <NavLink
          to="/"
          className="flex items-center gap-2 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-lg p-0.5"
        >
          <span className="size-6 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <CheckSquare size={13} className="text-white" />
          </span>
          <span className="font-mono font-bold text-text tracking-tight text-xs group-hover:text-primary-600 transition-colors">
            TaskMatrix
          </span>
        </NavLink>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                  isActive
                    ? 'text-primary-600 dark:text-primary-300 font-semibold bg-primary-500/10'
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Copyright Notice */}
        <p className="text-xs text-text-muted font-mono shrink-0">
          © {currentYear} TaskMatrix. All rights reserved.
        </p>
      </div>
    </footer>
  );
};