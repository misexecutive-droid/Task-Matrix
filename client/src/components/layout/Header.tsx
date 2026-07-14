import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router';
import { CheckSquare, LogOut, Menu, Moon, PanelLeft, Sun, X } from 'lucide-react';
import { NotificationBell } from '../../features/notifications/NotificationBell';

const NAV = [
    { to: '/', label: 'Dashboard' },
    { to: '/tasks', label: 'Task' },
    { to: '/projects', label: 'Projects' },
]

export const ICON_BUTTON_CLASS =
    'inline-flex items-center justify-center size-9 rounded-lg border border-border bg-surface ' +
    'text-text-secondary shadow-xs cursor-pointer ' +
    'transition-all duration-150 ' +
    'hover:text-text hover:bg-surface-hover hover:border-border-hover hover:shadow-sm ' +
    'active:scale-90 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const Header = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

                    <NavLink to="/" className="flex items-center gap-2.5 shrink-0">

                        {
                            onToggleSidebar && (
                                <button
                                    onClick={onToggleSidebar}
                                    className={ICON_BUTTON_CLASS}
                                    title="Toggle sidebar"
                                    aria-label="Toggle sidebar"
                                >
                                    <PanelLeft size={16} strokeWidth={2} />
                                </button>
                            )
                        }
                        <span className="size-7 rounded bg-primary-600 flex items-center justify-center shrink-0">

                            <CheckSquare size={14} className="text-white" />
                        </span>
                        <span className="hidden sm:inline font-display font-semibold text-text tracking-tight">
                            TaskMatrix
                        </span>


                    </NavLink>



                    <div className="flex items-center gap-2 sm:gap-3">

                        <NotificationBell/>

                        <button
                            onClick={toggleTheme}
                            className={`${ICON_BUTTON_CLASS} overflow-hidden`}
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                            aria-label="Toggle theme"
                        >
                            <span
                                className="inline-flex transition-transform duration-300 ease-out"
                                style={{ transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(180deg)' }}
                            >
                                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                            </span>
                        </button>

                        {
                            user && (
                                <button
                                    onClick={logout}
                                    title="Log out"
                                    className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-display font-medium text-text-secondary cursor-pointer transition-all duration-150 hover:text-danger hover:bg-danger/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    <LogOut size={15} />
                                    <span>Logout</span>
                                </button>
                            )
                        }
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className={`md:hidden ${ICON_BUTTON_CLASS}`}
                            title="Toggle menu"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X size={16} /> : <Menu size={16} />}
                        </button>

                    </div>
                </div>

                {menuOpen && (
                    <nav
                        className="md:hidden border-t border-border px-4 sm:px-6 py-3 flex flex-col gap-1 animate-dropdown-in"
                    >
                        {NAV.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) =>
                                    [
                                        'px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                                            : 'text-text-secondary hover:bg-surface-hover hover:text-text',
                                    ].join(' ')
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                        {user && (
                            <button
                                onClick={() => { setMenuOpen(false); logout(); }}
                                className="px-3 py-2 rounded-lg text-sm font-display font-medium text-left text-danger hover:bg-danger/10 transition-colors cursor-pointer flex items-center gap-2"
                            >
                                <LogOut size={15} />
                                Logout
                            </button>
                        )}
                    </nav>
                )}
            </div>
        </header>
    )
}