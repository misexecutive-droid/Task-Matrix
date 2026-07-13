import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { LayoutDashboard, Users, Building2, TicketCheck, Settings } from 'lucide-react'
import { useAuth } from "../../context/AuthContext"
import { Header } from "../../components/layout"

const NAV = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/users', icon: Users, label: 'Users', end: false },
    { to: '/admin/departments', icon: Building2, label: 'Departments', end: false },
    { to: '/admin/tickets', icon: TicketCheck, label: 'Tickets', end: false },
    { to: "/admin/settings", icon: Settings, label: "Settings", end: false }
]

export const AdminLayout = () => {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const initials = (user?.name ?? "A")
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className='flex flex-col min-h-svh' style={{ background: 'var(--bg-body)' }}>
            <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />
            <div className='flex flex-1 min-h-0'>
                <aside
                    className={
                        [
                            'flex flex-col border-r border-slate-200/60 transition-all duration-300 overflow-hidden shrink-0',
                            sidebarOpen ? 'w-60 px-3 py-5' : 'w-[60px] px-2 py-5',
                        ].join(' ')
                    }
                >
                    <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-slate-200/60">
                        <span className="size-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-display font-semibold shrink-0">
                            {initials}
                        </span>
                        {sidebarOpen && (
                            <span className="text-sm font-display font-medium text-slate-700 truncate">
                                {user?.name}
                            </span>
                        )}
                    </div>

                    <nav className="flex flex-col gap-1">
                        {NAV.map(({ to, icon: Icon, label, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                                    ].join(' ')
                                }
                            >
                                <Icon size={16} className="shrink-0" />
                                {sidebarOpen && <span className="truncate">{label}</span>}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-auto min-w-0 p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
