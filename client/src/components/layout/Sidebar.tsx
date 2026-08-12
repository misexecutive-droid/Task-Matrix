import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
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
  ChevronDown,
} from 'lucide-react';

interface NavChild {
  to: string;
  label: string;
  /** Shown as a disabled row with a "Soon" badge instead of a real link — for IA the reference
   *  design calls for but that has no backing state in the data model yet. */
  soon?: boolean;
}

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  children?: NavChild[];
}

const CHECKLIST_CHILDREN: NavChild[] = [
  { to: '/checklists', label: "Today's runs" },
];

const CHECKLIST_ADMIN_CHILDREN: NavChild[] = [
  { to: '/admin/checklist-templates', label: 'Task Templates' },
  { to: '/admin/scheduled-checklists', label: 'Templates' },
  { to: '/admin/scheduled-checklists/builder', label: 'Builder' },
];

// "My Tasks"/"Delegated Tasks"/"Pending Approvals" map onto TaskList's existing category/status
// filters via URL search params (read once on mount there) rather than being separate pages —
// there's only one real task list per user, just pre-filtered differently.
const TASK_CHILDREN: NavChild[] = [
  { to: '/tasks', label: 'My Tasks' },
  { to: '/tasks?category=delegation', label: 'Delegated Tasks' },
  { to: '/tasks?status=pending_verification', label: 'Pending Approvals' },
  { to: '/tasks/draft', label: 'Draft Tasks', soon: true },
  { to: '/tasks/archived', label: 'Archived', soon: true },
];

// Org-wide task list — admin-only (/admin/tasks), separate from the filtered views above.
const TASK_ADMIN_CHILDREN: NavChild[] = [
  { to: '/admin/tasks', label: 'Team Tasks' },
];

const NAV: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', children: TASK_CHILDREN },
  { to: '/tickets', icon: TicketCheck, label: 'Tickets' },
  { to: '/events', icon: CalendarClock, label: 'Events' },
  { to: '/checklists', icon: ClipboardCheck, label: 'Checklists', children: CHECKLIST_CHILDREN },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

// NavLink's built-in isActive only compares pathname, so a query-string child (e.g.
// "?category=delegation") would show active alongside the plain parent path at the same time —
// compare the full URL for those instead.
const isChildActive = (child: NavChild, location: { pathname: string; search: string }) =>
  child.to.includes('?')
    ? `${location.pathname}${location.search}` === child.to
    : location.pathname === child.to;

interface SidebarProps {
  isOpen: boolean;
  user: { name: string; email: string; role?: string } | null;
  logout: () => void;
  onNavigate?: () => void;
}

export const Sidebar = ({ isOpen, user, logout, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(NAV.filter((item) => item.children?.length).map((item) => item.to)),
  );

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navItems: NavItem[] = [
    ...NAV.map((item) => {
      if (item.label === 'Checklists' && isAdmin) {
        return { ...item, children: [...CHECKLIST_CHILDREN, ...CHECKLIST_ADMIN_CHILDREN] };
      }
      if (item.label === 'Tasks' && isAdmin) {
        return { ...item, children: [...TASK_CHILDREN, ...TASK_ADMIN_CHILDREN] };
      }
      return item;
    }),
    ...(user?.role === 'PC' || user?.role === 'ADMIN'
      ? [{ to: '/verify', icon: ShieldQuestion, label: 'Verification Queue' }]
      : []),
    ...(isAdmin ? [{ to: '/admin/users', icon: ShieldCheck, label: 'Admin' }] : []),
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 768) onNavigate?.();
  };

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'flex flex-col shrink-0 border-r border-border/60 transition-[width,padding,transform] duration-300 ease-in-out overflow-hidden',
          'fixed top-14 bottom-0 left-0 z-40 w-72 px-3 py-5',
          'md:static md:top-auto md:z-auto md:h-full md:translate-x-0 md:py-5',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isOpen ? 'md:w-60 md:px-3' : 'md:w-[68px] md:px-2.5',
        ].join(' ')}
        style={{ background: 'var(--color-surface)' }}
      >
        <p
          className={[
            'text-[11px] font-bold text-text-light uppercase tracking-wider px-3',
            'overflow-hidden whitespace-nowrap transition-[max-height,opacity,margin] duration-300 ease-in-out',
            isOpen ? 'max-h-5 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0',
          ].join(' ')}
        >
          Menu
        </p>

        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, icon: Icon, label, children }) => {
            const hasActiveChild = children?.some((child) => !child.soon && isChildActive(child, location)) ?? false;
            const hasChildren = !!children?.length;
            const isExpanded = expandedKeys.has(to);

            return (
              <div key={to}>
                <div className="flex items-center gap-1">
                  <NavLink
                    to={to}
                    end={to === '/'}
                    title={!isOpen ? label : undefined}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      [
                        'group/link flex flex-1 min-w-0 items-center rounded-lg text-[13px] font-semibold transition-[background-color,color,justify-content,padding] duration-200',
                        'px-3 py-2.5',
                        isOpen ? 'md:px-3' : 'md:justify-center md:px-0',
                        isActive || hasActiveChild
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-text-secondary font-medium hover:bg-surface-hover hover:text-text',
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
                            isActive || hasActiveChild ? 'text-primary-700' : 'text-text-muted group-hover/link:text-text-secondary',
                          ].join(' ')}
                        />
                        <span
                          className={[
                            'truncate leading-none transition-[max-width,opacity,margin] duration-300 ease-in-out',
                            isOpen ? 'max-w-[10rem] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0',
                          ].join(' ')}
                        >
                          {label}
                        </span>
                      </>
                    )}
                  </NavLink>

                  {hasChildren && isOpen && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(to)}
                      aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
                      aria-expanded={isExpanded}
                      className="shrink-0 p-1.5 rounded-md text-text-light hover:text-text hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                    >
                      <ChevronDown
                        size={14}
                        strokeWidth={2.5}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </button>
                  )}
                </div>

                {hasChildren && isOpen && isExpanded && (
                  <div className="flex flex-col gap-0.5 mt-0.5 mb-1 ml-[1.55rem] pl-3 border-l border-border">
                    {children!.map((child) => {
                      if (child.soon) {
                        return (
                          <span
                            key={child.to}
                            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-text-light cursor-not-allowed select-none"
                          >
                            {child.label}
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-hover border border-border text-text-light">
                              Soon
                            </span>
                          </span>
                        );
                      }

                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={handleNavClick}
                          className={[
                            'rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors duration-200',
                            isChildActive(child, location)
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-text-secondary font-medium hover:bg-surface-hover hover:text-text',
                          ].join(' ')}
                        >
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border my-3" />

        <div
          className={[
            'flex items-center p-1.5 rounded-xl bg-surface-hover border border-border transition-[justify-content] duration-200',
            isOpen ? '' : 'md:justify-center',
          ].join(' ')}
        >
          <div
            className="size-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0"
            title={user?.name}
          >
            {initials}
          </div>

          <div
            className={[
              'flex items-center gap-2 min-w-0 overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out',
              isOpen ? 'max-w-[10rem] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0',
            ].join(' ')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate leading-tight">
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
