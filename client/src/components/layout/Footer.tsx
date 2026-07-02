import { CheckSquare } from "lucide-react"
import { NavLink } from "react-router"

const LINKS = [
    { to : '/tasks' , label : 'Task'},
    {to : '/projects', label : 'Projects '},
    { to : '/calendar', label : 'Calendar'},
    { to : '/settings' , label : 'Settings'},

]

export const Footer = () => {
    return (
        <footer
         className="w-full border-t border-slate-200/60 mt-auto "
         style={{ background : 'var(--glass-bg)'}}
         >

            <div className = "max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-x-6 gap-y-2">
                <span className="size-6 rounded bg-primary-600 flex items-center justify-center">
                    <CheckSquare size={14} className="text-white"/>
                </span>
            

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">

                {
                    LINKS.map(({to , label}) => (
                        <NavLink 
                          key={to}
                          to={to}
                          className="text-sm font-display text-slate-500 hover:text-slate-800 transition-colors"
                          >

                            {label}
                          </NavLink>
                    ))
                }
            </nav>

            <p className="text-xs text-slate-400 font-display">
                {`© ${new Date().getFullYear()} TaskMatrix. All rights reserved.`}

            </p>
        </div>

        </footer>
    )
}