import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Header, Footer, Sidebar } from '../../components/layout';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'var(--bg-body)' }}>

      <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={sidebarOpen}
          user={user}
          logout={logout}
          onNavigate={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-auto min-w-0 relative">

          
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 size-125 rounded-full bg-primary-400/10 blur-3xl" />
            <div className="absolute top-1/2 -left-48 size-100 rounded-full bg-coral-400/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 size-87.5 rounded-full bg-primary-300/8 blur-3xl" />
          </div>

          <div className="relative z-10 p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};