import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router';
import { CheckSquare, Menu, Moon, PanelLeft, Sun, X } from 'lucide-react';
import { Button } from '../button';

const NAV = [
    { to: '/', label: 'Dashboard' },
    { to: '/tasks', label: 'Task' },
    { to: '/projects', label: 'Projects' },
]

export const Header = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/60"
                style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

                    <NavLink to="/" className="flex items-center gap-2.5 shrink-0">

                        {
                            onToggleSidebar && (
                                <Button
                                    onClick={onToggleSidebar}
                                    className="size-9 rounded-lg border border-slate-200 flex items-center justify-center hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                                    aria-label="Toggle sidebar"
                                >
                                    <PanelLeft size={15} />

                                </Button>
                            )
                        }
                        <span className="size-7 rounded bg-primary-600 flex items-center justify-center">

                            <CheckSquare size={14} className="text-white" />
                        </span>
                        <span className="font-display font-semibold text-slate-900 tracking-tight">
                            TaskMatrix
                        </span>


                    </NavLink>



                    <div className="flex items-center gap-3">
                        <Button
                            onClick={toggleTheme}
                            className="size-9 rounded-lg border border-slate-200 flex items-center justify-center hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                        </Button>


                        {
                            user && (
                                <Button
                                    onClick={logout}
                                    className="hidden md:block text-sm font-display text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    Logout
                                </Button>
                            )
                        }
                        <Button
                            onClick={() => setMenuOpen(v => !v)}
                            className="md:hidden size-9 rounded-lg flex border border-slate-200 items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                            aria-label="Toggle menu">
                            {menuOpen ? <X size={15} /> : <Menu size={15} />}
                        </Button>

                    </div>

                    {menuOpen && (
                        <nav
                            className="md:hidden border-t border-slate-200/60 py-3 flex flex-col gap-1"
                            style={{ background: 'var(--glass-bg)' }}
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
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                                        ].join(' ')
                                    }
                                >
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    )}






                </div>


            </header>
        </>
    )
}

