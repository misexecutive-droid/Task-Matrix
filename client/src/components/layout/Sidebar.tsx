import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Settings,
  LogOut,
  TicketCheck,
  ShieldCheck,
  ClipboardCheck,
  ShieldQuestion,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/tickets', icon: TicketCheck, label: 'Tickets' },
  { to: '/checklists', icon: ClipboardCheck, label: 'My Checklists' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  user: { name: string; email: string; role?: string } | null;
  logout: () => void;
  /** Called on backdrop click / nav-link click so mobile callers can close the drawer. */
  onNavigate?: () => void;
}

export const Sidebar = ({ isOpen, user, logout, onNavigate }: SidebarProps) => {
  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navItems = [
    ...NAV,
    ...(user?.role === 'PC' || user?.role === 'ADMIN'
      ? [{ to: '/verify', icon: ShieldQuestion, label: 'Verification Queue' }]
      : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/admin/users', icon: ShieldCheck, label: 'Admin' }] : []),
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 768) onNavigate?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={[
          'flex flex-col shrink-0 border-r border-border/60 transition-all duration-300 ease-in-out overflow-hidden',
          'fixed inset-y-0 left-0 z-40 w-72 px-3 py-5',
          'md:static md:z-auto md:translate-x-0 md:py-5',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isOpen ? 'md:w-60 md:px-3' : 'md:w-[68px] md:px-2.5',
        ].join(' ')}
        style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
      >
        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!isOpen ? label : undefined}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'group flex items-center rounded-xl text-xs font-mono font-semibold transition-all duration-200',
                  'gap-3 px-3 py-2.5',
                  isOpen ? 'md:px-3' : 'md:justify-center md:px-0',
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text',
                ].join(' ')
              }
            >
              <Icon size={18} className="shrink-0 transition-transform group-hover:scale-105" />
              <span
                className={[
                  'truncate leading-none transition-opacity duration-200',
                  isOpen ? 'opacity-100' : 'md:hidden md:opacity-0',
                ].join(' ')}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border/50 my-3" />

        {/* User Footer Profile */}
        <div
          className={[
            'flex items-center gap-3 p-1.5 rounded-xl bg-surface-hover/30 border border-border/40 transition-all',
            isOpen ? '' : 'md:flex-col md:bg-transparent md:border-transparent md:p-0',
          ].join(' ')}
        >
          {/* Avatar */}
          <div
            className="size-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-mono font-bold shrink-0 shadow-xs"
            title={user?.name}
          >
            {initials}
          </div>

          {/* User Details */}
          <div className={['flex-1 min-w-0', isOpen ? '' : 'md:hidden'].join(' ')}>
            <p className="text-xs font-mono font-semibold text-text truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] text-text-muted truncate leading-tight">{user?.email}</p>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
};