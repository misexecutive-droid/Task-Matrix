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
}

export const Sidebar = ({ isOpen, user, logout }: SidebarProps) => {
  const initials = (user?.name ?? 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const navItems = user?.role === 'ADMIN'
    ? [...NAV, { to: '/admin/users', icon: ShieldCheck, label: 'Admin' }]
    : NAV;


  return (
    <aside
      className={[
        'flex flex-col shrink-0 border-r border-slate-200/60 transition-all duration-300 overflow-hidden',
        isOpen ? 'w-60 px-3 py-5' : 'w-[60px] px-2 py-5',
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
            className={({ isActive }) => [
              'group flex items-center rounded-lg text-sm font-display font-medium transition-all duration-200 overflow-hidden',
              isOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5 px-0',
              isActive
                ? 'bg-primary-800 text-white shadow-sm shadow-primary-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={17} className="shrink-0" />
            {isOpen && (
              <span className="truncate leading-none">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-slate-200/60 my-3" />

      {/* User row */}
      {isOpen ? (
        <div className="flex items-center gap-3 px-1">
          <span className="size-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-display font-bold shrink-0">
            {initials}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-semibold text-slate-800 truncate leading-none mb-0.5">
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate leading-none">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span
            title={user?.name}
            className="size-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-display font-bold cursor-default"
          >
            {initials}
          </span>
          <button
            onClick={logout}
            title="Log out"
            className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
};
