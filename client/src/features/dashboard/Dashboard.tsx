import {
  LayoutDashboard, 
  CheckSquare,    
  FolderKanban,    
  Calendar,        
  Settings,        
  LogOut,
  TicketCheck,          
           
} from 'lucide-react';

import { NavLink, Outlet } from 'react-router';


import { useAuth }     from '../../context/AuthContext';
import { Header }      from '../../components/layout/Header';
import { Footer }      from '../../components/layout/Footer';

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',    icon: CheckSquare,     label: 'Tasks'     },
  { to: '/tickets',  icon: TicketCheck,     label: 'Tickets'   },
  { to: '/projects', icon: FolderKanban,    label: 'Projects'  },
  { to: '/calendar', icon: Calendar,        label: 'Calendar'  },
  { to: '/settings', icon: Settings,        label: 'Settings'  },
];

export const Dashboard = () => {
  const { user, logout } = useAuth();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'var(--bg-body)' }}>

     
      <Header />

      
      <div className="flex flex-1 min-h-0">

     
        <aside
          className="hidden md:flex flex-col w-64 shrink-0 p-5 gap-6 border-r border-slate-200/60"
          style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}
        >
         
          <nav className="flex flex-col gap-1 flex-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-800'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                ].join(' ')}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          
          <div className="flex items-center gap-3 px-2 pt-4 border-t border-slate-200/60">
            <span className="size-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-display font-semibold shrink-0">
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </aside>

    
        <main className="flex-1 p-6 overflow-auto min-w-0">
          <Outlet />
        </main>

      </div>
     
      <Footer />

    </div>
  );
};