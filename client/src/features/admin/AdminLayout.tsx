import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  Store,
  TicketCheck,
  Settings,
  ListChecks,
  ClipboardList,
  FileDown,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/layout";
import { Breadcrumbs } from "../../components/breadcrumbs";

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Navigation Config ---
interface AdminNavChild {
  to: string;
  label: string;
}

interface AdminNavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end: boolean;
  children?: AdminNavChild[];
}

const NAV: AdminNavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics & Dashboard', end: false },
  { to: '/admin/users', icon: Users, label: 'Users', end: false },
  { to: '/admin/departments', icon: Building2, label: 'Departments', end: false },
  { to: '/admin/stores', icon: Store, label: 'Stores', end: false },
  {
    to: '/admin/checklist-templates',
    icon: ListChecks,
    label: 'Checklists',
    end: false,
    children: [
      { to: '/admin/checklist-templates', label: 'Task Templates' },
      { to: '/admin/scheduled-checklists', label: 'Templates' },
      { to: '/admin/scheduled-checklists/builder', label: 'Builder' },
    ],
  },
  { to: '/admin/tickets', icon: TicketCheck, label: 'Tickets', end: false },
  { to: '/admin/tasks', icon: ClipboardList, label: 'Tasks', end: false },
  { to: '/admin/reports', icon: FileDown, label: 'Reports', end: false },
  { to: '/admin/settings', icon: Settings, label: 'Settings', end: false },
];

export const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );

  // Groups with children start expanded (matches the reference design's always-open groups) —
  // the arrow just lets you fold ones you don't need.
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(NAV.filter((item) => item.children?.length).map((item) => item.to))
  );

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Longest matching `to` wins, so a child route (e.g. /admin/scheduled-checklists) resolves to
  // its own breadcrumb label instead of falling through to the default when it's no longer a
  // top-level NAV entry.
  const currentNav = NAV.flatMap((n) => [
    { to: n.to, label: n.label, end: n.end },
    ...(n.children ?? []).map((c) => ({ to: c.to, label: `${n.label} · ${c.label}`, end: false })),
  ])
    .filter((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  
  const initials = (user?.name || "Admin")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-svh overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />
      
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Backdrop Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Navigation */}
        <aside
          className={cn(
            "flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md",
            "transition-all duration-300 ease-in-out overflow-hidden shrink-0 shadow-sm md:shadow-none",
            "fixed top-14 bottom-0 left-0 z-40 w-72 px-4 py-6",
            "md:static md:top-auto md:z-auto md:py-6",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            sidebarOpen ? "md:w-64" : "md:w-[84px] md:px-3"
          )}
        >
          {/* User Profile Area */}
          <div className={cn(
            "flex items-center gap-3 pb-6 mb-4 border-b border-slate-100 dark:border-slate-800/60 transition-all duration-300",
            !sidebarOpen && "md:justify-center"
          )}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-700 text-white text-sm font-bold shrink-0 shadow-md ring-2 ring-white dark:ring-slate-900 transition-transform hover:scale-105">
              {initials}
            </div>
            <div className={cn("flex flex-col min-w-0 transition-opacity duration-300", !sidebarOpen && "md:hidden md:opacity-0")}>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user?.name || "Administrator"}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Workspace Admin
              </span>
            </div>
          </div>

          <p className={cn(
            "text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 transition-opacity duration-300",
            !sidebarOpen && "md:hidden md:opacity-0"
          )}>
            Navigation
          </p>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
            {NAV.map(({ to, icon: Icon, label, end, children }) => {
              const hasChildren = !!children?.length;
              const hasActiveChild = children?.some((c) => location.pathname.startsWith(c.to)) ?? false;
              const isExpanded = expandedKeys.has(to);

              return (
                <div key={to}>
                  <div className="flex items-center gap-1">
                    <NavLink
                      to={to}
                      end={end}
                      onClick={handleNavClick}
                      className={({ isActive }) => cn(
                        "group relative flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 ease-in-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950",
                        "active:scale-[0.98]",
                        !sidebarOpen && "md:justify-center md:px-0",
                        (isActive || hasActiveChild)
                          ? "bg-primary-50 text-primary-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                      )}
                      title={!sidebarOpen ? label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              "w-[17px] h-[17px] shrink-0 transition-all duration-300 group-hover:scale-110",
                              (isActive || hasActiveChild)
                                ? "text-primary-700"
                                : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                            )}
                            strokeWidth={(isActive || hasActiveChild) ? 2 : 1.75}
                          />
                          <span className={cn(
                            "truncate transition-opacity duration-300",
                            !sidebarOpen && "md:hidden md:opacity-0"
                          )}>
                            {label}
                          </span>

                          {/* Active Indicator Pip (Visible only when sidebar is collapsed) */}
                          {!sidebarOpen && (isActive || hasActiveChild) && (
                            <span className="hidden md:block absolute left-1 w-1 h-1/2 bg-primary-700 rounded-full" />
                          )}
                        </>
                      )}
                    </NavLink>

                    {/* Expand/collapse arrow — a sibling of the link, not nested inside its <a>,
                        so toggling children never fires navigation. */}
                    {hasChildren && sidebarOpen && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(to)}
                        aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
                        aria-expanded={isExpanded}
                        className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/50 dark:hover:text-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <ChevronDown
                          className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded ? "rotate-180" : "rotate-0")}
                          strokeWidth={2.5}
                        />
                      </button>
                    )}
                  </div>

                  {/* Sub-section — only rendered while the sidebar is open AND this group is expanded. */}
                  {hasChildren && sidebarOpen && isExpanded && (
                    <div className="flex flex-col gap-0.5 mt-0.5 mb-1 ml-[1.65rem] pl-3 border-l border-slate-200 dark:border-slate-800">
                      {children!.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={handleNavClick}
                          className={({ isActive }) => cn(
                            "rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors duration-200",
                            isActive
                              ? "bg-primary-50 text-primary-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                          )}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            
            <Breadcrumbs
              items={[
                { label: 'Admin', to: '/admin' }, 
                { label: currentNav?.label ?? 'Overview' }
              ]}
              className="mb-6 sm:mb-8"
            />
            
            {/* Route Transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
            
          </div>
        </main>
        
      </div>
    </div>
  );
};