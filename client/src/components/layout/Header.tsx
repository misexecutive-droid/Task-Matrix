import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router';
import {
  CheckSquare,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { Dropdown, type DropdownAction } from '../dropdown';
import { RoleSwitcher } from './RoleSwitcher';
import { HeaderSearchInput } from './HeaderSearchInput';

// Refined to be flatter and more modern. Removed borders/shadows for a cleaner UI.
export const ICON_BUTTON_CLASS =
  'inline-flex items-center justify-center size-8 rounded-md text-text-secondary ' +
  'transition-all duration-200 ease-out cursor-pointer ' +
  'hover:text-text hover:bg-surface-hover ' +
  'active:scale-95 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50';

// Placeholder-only for now — not tied to real permissions. Task-Matrix's actual roles are
// ADMIN/PC/MANAGER/AGENT/USER; these labels just mirror the reference design visually until
// there's a real decision about what (if anything) this should switch.
const ROLE_VIEW_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'store_mgr', label: 'Store Mgr' },
  { value: 'area_head', label: 'Area Head' },
  { value: 'md', label: 'MD' },
];

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export const Header = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [roleView, setRoleView] = useState(ROLE_VIEW_OPTIONS[0].value);

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const accountActions: DropdownAction[] = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Settings', to: '/settings', icon: Settings },
    {
      label: 'Sign out',
      onClick: logout,
      icon: LogOut,
      variant: 'destructive',
      separatorBefore: true,
    },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-surface/80 backdrop-blur-md transition-colors"
      style={{
        // Keep your custom glass variables as fallbacks if defined in your theme
        background: 'var(--glass-bg, rgba(var(--color-surface), 0.8))',
        backdropFilter: 'var(--glass-blur, blur(12px))',
        WebkitBackdropFilter: 'var(--glass-blur, blur(12px))',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center gap-3 sm:gap-4">

          {/* Left Module: Sidebar Toggle + Brand */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className={ICON_BUTTON_CLASS}
                title="Toggle navigation sidebar"
                aria-label="Toggle navigation sidebar"
              >
                <PanelLeft size={18} strokeWidth={1.75} />
              </button>
            )}

            <NavLink
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-md py-1 px-1.5 -ml-1.5 transition-colors hover:bg-surface-hover"
            >
              <div className="size-7 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                <CheckSquare size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline font-display font-semibold text-text text-sm tracking-tight group-hover:text-primary-500 transition-colors">
                TaskMatrix
              </span>
            </NavLink>
          </div>

          {/* Center Module: Search — flexes to fill the space between brand and the right cluster,
              capped so it doesn't stretch edge-to-edge on very wide screens. */}
          <div className="hidden md:flex flex-1 justify-center px-2">
            <div className="w-full max-w-md">
              <HeaderSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search checklists, tasks, tickets…"
              />
            </div>
          </div>

          {/* Right Module: role switcher + grouped action pill + account, separated by dividers */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0">
            <RoleSwitcher options={ROLE_VIEW_OPTIONS} value={roleView} onChange={setRoleView} />

            <div className="flex items-center gap-0.5 p-1 rounded-full bg-surface-hover/60">
              <NotificationBell />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`${ICON_BUTTON_CLASS} overflow-hidden`}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label="Toggle visual theme"
              >
                <span
                  className="inline-flex transition-transform duration-500 ease-spring"
                  style={{
                    transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                >
                  {theme === 'light' ? <Moon size={17} strokeWidth={1.75} /> : <Sun size={17} strokeWidth={1.75} />}
                </span>
              </button>
            </div>

            {/* User Dropdown Profile (Desktop) — two-line name/role, matching the reference's
                avatar + "Name" / "Role, Location" block. No location field exists on the auth
                user yet, so the second line only ever shows the role. */}
            {user && (
              <div className="hidden sm:block pl-1.5 ml-1.5 border-l border-border/50">
                <Dropdown
                  items={accountActions}
                  trigger={
                    <button
                      title={user.name}
                      className="flex items-center gap-2.5 h-10 pl-1 pr-2.5 rounded-full text-text-secondary cursor-pointer transition-all duration-200 hover:bg-surface-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                    >
                      <span className="relative flex items-center justify-center size-8 rounded-full bg-primary-700 text-white font-semibold text-[11px] shrink-0">
                        {initials || <User size={14} strokeWidth={2} />}
                        {/* Minimal online indicator */}
                        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-success border-2 border-surface" aria-hidden="true" />
                      </span>
                      <span className="hidden lg:flex flex-col items-start min-w-0 leading-tight">
                        <span className="max-w-[120px] truncate text-[13px] font-semibold text-text">{user.name}</span>
                        {user.role && (
                          <span className="max-w-[120px] truncate text-[11px] text-text-muted">{titleCase(user.role)}</span>
                        )}
                      </span>
                      <ChevronDown size={14} className="text-text-muted shrink-0" strokeWidth={2} />
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
