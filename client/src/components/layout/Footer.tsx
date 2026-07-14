import { CheckSquare } from "lucide-react"
import { NavLink } from "react-router"

const LINKS = [
    { to: '/tasks', label: 'Task' },
    { to: '/projects', label: 'Projects' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/settings', label: 'Settings' },
]

export const Footer = () => {
    return (
        <footer
         className="w-full border-t border-border mt-auto"
         style={{ background : 'var(--glass-bg)'}}
         >

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-x-6 gap-y-4">

                <NavLink to="/" className="flex items-center gap-2 shrink-0">
                    <span className="size-7 rounded bg-primary-600 flex items-center justify-center shrink-0">
                        <CheckSquare size={14} className="text-white" />
                    </span>
                    <span className="font-display font-semibold text-text tracking-tight text-sm">
                        TaskMatrix
                    </span>
                </NavLink>

                <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
                    {
                        LINKS.map(({ to, label }) => (
                            <NavLink
                              key={to}
                              to={to}
                              className={({ isActive }) => [
                                  'px-2.5 py-1 rounded-md text-sm font-display transition-colors',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
                                  isActive
                                      ? 'text-primary-600 dark:text-primary-300 font-medium'
                                      : 'text-text-secondary hover:text-text hover:bg-surface-hover',
                              ].join(' ')}
                              >
                                {label}
                              </NavLink>
                        ))
                    }
                </nav>

                <p className="text-xs text-text-light font-display shrink-0">
                    {`© ${new Date().getFullYear()} TaskMatrix. All rights reserved.`}
                </p>
            </div>

        </footer>
    )
}