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
  CalendarClock,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/tickets', icon: TicketCheck, label: 'Tickets' },
  { to: '/events', icon: CalendarClock, label: 'Events' },
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

      {/*
        On desktop the aside's own width changes (68px rail <-> 240px expanded, via
        md:hover:w-60, or pinned open via isOpen) — since it's a normal in-flow flex item next
        to <main>, the flex row naturally reflows main's width along with it. No absolute
        positioning/overlay: the page moves with the sidebar, as requested.
      */}
      <aside
        className={[
          'group flex flex-col shrink-0 border-r border-border/60 transition-[width,padding,transform] duration-300 ease-in-out overflow-hidden',
          'fixed top-14 bottom-0 left-0 z-40 w-72 px-3 py-5',
          'md:static md:top-auto md:z-auto md:h-full md:translate-x-0 md:py-5',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isOpen ? 'md:w-60 md:px-3' : 'md:w-[68px] md:px-2.5 md:hover:w-60 md:hover:px-3',
        ].join(' ')}
        style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
      >
        {/* Section Label — max-height/opacity fade instead of a hidden/block snap, so it eases
            in and out in sync with the rail's own width transition rather than popping. */}
        <p
          className={[
            'text-[11px] font-display font-semibold text-text-light uppercase tracking-wider px-3',
            'overflow-hidden whitespace-nowrap transition-[max-height,opacity,margin] duration-300 ease-in-out',
            isOpen ? 'max-h-5 opacity-100 mb-2' : 'md:max-h-0 md:opacity-0 md:mb-0 md:group-hover:max-h-5 md:group-hover:opacity-100 md:group-hover:mb-2',
          ].join(' ')}
        >
          Menu
        </p>

        {/* Navigation Links — no gap on the row: spacing between icon and label comes from the
            label's own margin, which collapses to 0 together with its width, so the icon is the
            only thing left in the row and justify-center truly centers it (a flex `gap` reserves
            space between items even at max-w-0, which was pushing the icon off-center before). */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!isOpen ? label : undefined}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'group/link flex items-center rounded-lg text-xs font-display font-medium transition-[background-color,color,justify-content,padding] duration-200',
                  'px-3 py-2.5',
                  isOpen ? 'md:px-3' : 'md:justify-center md:px-0 md:group-hover:justify-start md:group-hover:px-3',
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                    : 'text-text-secondary hover:bg-surface-hover/70 hover:text-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    strokeWidth={1.75}
                    className={[
                      'shrink-0 transition-transform group-hover/link:scale-105',
                      isActive ? 'text-primary-500' : 'text-text-muted group-hover/link:text-text-secondary',
                    ].join(' ')}
                  />
                  {/* max-width/opacity/margin fade instead of a hidden/inline snap, so the label
                      eases in and out alongside the rail's width transition rather than popping. */}
                  <span
                    className={[
                      'truncate leading-none transition-[max-width,opacity,margin] duration-300 ease-in-out',
                      isOpen ? 'max-w-[10rem] opacity-100 ml-3' : 'md:max-w-0 md:opacity-0 md:ml-0 md:group-hover:max-w-[10rem] md:group-hover:opacity-100 md:group-hover:ml-3',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border/50 my-3" />

        {/* User Footer Profile — same no-gap/margin-instead technique as the nav links above,
            so the avatar centers cleanly when the trailing name/email/logout group collapses. */}
        <div
          className={[
            'flex items-center p-1.5 rounded-xl bg-surface-hover/30 border border-border/40 transition-[justify-content] duration-200',
            isOpen ? '' : 'md:justify-center md:group-hover:justify-start',
          ].join(' ')}
        >
          {/* Avatar */}
          <div
            className="size-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-display font-bold shrink-0 shadow-xs"
            title={user?.name}
          >
            {initials}
          </div>

          {/* User Details + Logout */}
          <div
            className={[
              'flex items-center gap-2 min-w-0 overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out',
              isOpen ? 'max-w-[10rem] opacity-100 ml-3' : 'md:max-w-0 md:opacity-0 md:ml-0 md:group-hover:max-w-[10rem] md:group-hover:opacity-100 md:group-hover:ml-3',
            ].join(' ')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-text truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[11px] text-text-muted truncate leading-tight">{user?.email}</p>
            </div>

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
        </div>
      </aside>
    </>
  );
};