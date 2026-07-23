import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NavLink, useLocation } from 'react-router';
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

// Current-section label shown next to the brand mark. Sidebar already owns full primary
// navigation (and doubles as the mobile nav drawer via the sidebar toggle below) — this
// label is just orientation, the same idea as Linear/Vercel naming the active section.
const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/tickets': 'Tickets',
  '/checklists': 'My Checklists',
  '/projects': 'Projects',
  '/calendar': 'Calendar',
  '/settings': 'Settings',
  '/admin': 'TAT Report',
  '/admin/users': 'Users',
  '/admin/departments': 'Departments',
  '/admin/checklist-templates': 'Checklist Templates',
  '/admin/tickets': 'Tickets',
  '/admin/settings': 'Settings',
};

export const ICON_BUTTON_CLASS =
  'inline-flex items-center justify-center size-9 rounded-xl border border-border/60 bg-surface/80 ' +
  'text-text-secondary shadow-2xs cursor-pointer ' +
  'transition-all duration-200 ' +
  'hover:text-text hover:bg-surface-hover hover:border-border/80 hover:shadow-xs ' +
  'active:scale-95 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2';

export const Header = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const pageLabel = PAGE_LABELS[pathname];

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
      className="sticky top-0 z-50 w-full border-b border-border/60 transition-colors"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* Left Brand Anchor */}
          <div className="flex items-center gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className={ICON_BUTTON_CLASS}
                title="Toggle navigation sidebar"
                aria-label="Toggle navigation sidebar"
              >
                <PanelLeft size={17} strokeWidth={1.8} />
              </button>
            )}

            <NavLink
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-lg p-0.5"
            >
              <div className="size-8 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-xs shadow-primary-600/30 group-hover:scale-105 transition-transform">
                <CheckSquare size={16} className="text-white" />
              </div>
              <span className="hidden sm:inline font-mono font-bold text-text text-base tracking-tight group-hover:text-primary-600 transition-colors">
                TaskMatrix
              </span>
            </NavLink>

            {pageLabel && (
              <>
                <span className="hidden sm:block w-px h-5 bg-border/70 shrink-0" aria-hidden="true" />
                <h1 className="hidden sm:block text-sm font-mono font-medium text-text-secondary truncate">
                  {pageLabel}
                </h1>
              </>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <NotificationBell />

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`${ICON_BUTTON_CLASS} overflow-hidden`}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle visual theme"
            >
              <span
                className="inline-flex transition-transform duration-300 ease-spring"
                style={{
                  transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </span>
            </button>

            {/* User Dropdown Profile (Desktop) */}
            {user && (
              <Dropdown
                items={accountActions}
                trigger={
                  <button
                    title={user.name}
                    className="hidden md:inline-flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-xl border border-border/60 bg-surface/50 text-xs font-mono font-medium text-text-secondary cursor-pointer transition-all duration-150 hover:text-text hover:bg-surface-hover hover:border-border active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                  >
                    <span className="relative shrink-0">
                      <span className="flex items-center justify-center size-5.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-[10px]">
                        {initials || <User size={11} />}
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-success border-2 border-surface" aria-hidden="true" />
                    </span>
                    <span className="max-w-28 truncate">{user.name}</span>
                    <ChevronDown size={13} className="text-text-muted shrink-0" />
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};