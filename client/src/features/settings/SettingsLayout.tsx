import { NavLink, Outlet } from 'react-router';
import { Settings as SettingsIcon, Tag } from 'lucide-react';

const NAV = [
  { to: '/settings/categories', icon: Tag, label: 'Categories' },
];

export const SettingsLayout = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
          <SettingsIcon size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold text-text">Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage system configuration.</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 border-b border-border">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 px-3.5 py-2.5 text-sm font-display font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-300'
                  : 'border-transparent text-text-secondary hover:text-text hover:border-border-hover',
              ].join(' ')
            }
          >
            <Icon size={15} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};
