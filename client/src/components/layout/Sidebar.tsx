import { NavLink } from 'react-router';
import {
  LayoutDashboard, CheckSquare, FolderKanban,
  Calendar, Settings, LogOut, TicketCheck, ShieldCheck,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/tickets', icon: TicketCheck, label: 'Tickets' },
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
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const navItems = user?.role === 'ADMIN'
    ? [...NAV, { to: '/admin/users', icon: ShieldCheck, label: 'Admin' }]
    : NAV;

  const handleNavClick = () => {
    if (window.innerWidth < 768) onNavigate?.();
  };

  return (
    <>
      {/* Mobile backdrop — only rendered (and only intercepts clicks) below md, while open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'flex flex-col shrink-0 border-r border-border transition-all duration-300 overflow-hidden',
          'fixed inset-y-0 left-0 z-40 w-72 px-3 py-5',
          'md:static md:z-auto md:translate-x-0 md:py-5',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isOpen ? 'md:w-60 md:px-3' : 'md:w-[60px] md:px-2',
        ].join(' ')}
        style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
      >
        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!isOpen ? label : undefined}
              onClick={handleNavClick}
              className={({ isActive }) => [
                'group flex items-center rounded-lg text-sm font-display font-medium transition-all duration-200 overflow-hidden',
                'gap-3 px-3 py-2.5 md:gap-3',
                isOpen ? 'md:px-3' : 'md:justify-center md:py-2.5 md:px-0',
                isActive
                  ? 'bg-primary-700 text-white shadow-sm shadow-primary-900/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text',
              ].join(' ')}
            >
              <Icon size={17} className="shrink-0" />
              <span className={['truncate leading-none', isOpen ? '' : 'md:hidden'].join(' ')}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* User row */}
        <div className={['flex items-center gap-3 px-1', isOpen ? '' : 'md:flex-col md:px-0'].join(' ')}>
          <span className="size-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-display font-bold shrink-0">
            {initials}
          </span>
          <div className={['flex-1 min-w-0', isOpen ? '' : 'md:hidden'].join(' ')}>
            <p className="text-xs font-display font-semibold text-text truncate leading-none mb-0.5">
              {user?.name}
            </p>
            <p className="text-[11px] text-text-light truncate leading-none">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="size-7 rounded-md flex items-center justify-center text-text-light hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
            aria-label="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  );
};
