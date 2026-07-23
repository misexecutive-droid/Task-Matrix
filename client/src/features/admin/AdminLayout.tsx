import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { LayoutDashboard, Users, Building2, TicketCheck, Settings, ListChecks , ClipboardList, Repeat } from 'lucide-react'
import { useAuth } from "../../context/AuthContext"
import { Header } from "../../components/layout"
import { Breadcrumbs } from "../../components/breadcrumbs"

const NAV = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/users', icon: Users, label: 'Users', end: false },
    { to: '/admin/departments', icon: Building2, label: 'Departments', end: false },
    { to: '/admin/checklist-templates', icon: ListChecks, label: 'Checklists', end: false },
    { to: '/admin/scheduled-checklists', icon: Repeat, label: 'Recurring Checklists', end: false },
    { to: '/admin/tickets', icon: TicketCheck, label: 'Tickets', end: false },
    { to : '/admin/tasks' , icon : ClipboardList , label : 'Tasks', end : false},
    { to: "/admin/settings", icon: Settings, label: "Settings", end: false }
]


export const AdminLayout = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
    )
    const currentNav = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))
    const initials = (user?.name ?? "A")
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleNavClick = () => {
        if (window.innerWidth < 768) setSidebarOpen(false)
    }

    return (
        <div className='flex flex-col min-h-svh' style={{ background: 'var(--bg-body)' }}>
            <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />
            <div className='flex flex-1 min-h-0'>
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 z-30 bg-black/40"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                <aside
                    className={
                        [
                            'flex flex-col border-r border-border transition-all duration-300 overflow-hidden',
                            'fixed inset-y-0 left-0 z-40 w-72 px-3 py-5',
                            'md:static md:z-auto md:translate-x-0 md:py-5 md:shrink-0',
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                            sidebarOpen ? 'md:w-60 md:px-3' : 'md:w-[60px] md:px-2',
                        ].join(' ')
                    }
                    style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
                >
                    <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-border">
                        <span className="size-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-display font-semibold shrink-0">
                            {initials}
                        </span>
                        <span className={['text-sm font-display font-medium text-text truncate', sidebarOpen ? '' : 'md:hidden'].join(' ')}>
                            {user?.name}
                        </span>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {NAV.map(({ to, icon: Icon, label, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors',
                                        sidebarOpen ? '' : 'md:justify-center md:px-0',
                                        isActive
                                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text',
                                    ].join(' ')
                                }
                            >
                                <Icon size={16} className="shrink-0" />
                                <span className={['truncate', sidebarOpen ? '' : 'md:hidden'].join(' ')}>{label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-auto min-w-0 p-4 sm:p-6 lg:p-8">
                    <Breadcrumbs
                        items={[{ label: 'Admin', to: '/admin' }, { label: currentNav?.label ?? 'Overview' }]}
                        className="mb-5"
                    />
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
