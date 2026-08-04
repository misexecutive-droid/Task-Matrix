import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Header, Footer, Sidebar } from '../../components/layout';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div 
      className="flex flex-col h-svh overflow-hidden text-text transition-colors duration-300" 
      style={{ background: 'var(--bg-body)' }}
    >
      <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />

      <div className="flex flex-1 min-h-0 relative z-0">
        <Sidebar
          isOpen={sidebarOpen}
          user={user}
          logout={logout}
          onNavigate={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-auto min-w-0 relative">
          
          {/* Ambient Mesh Gradient Background */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[45rem] h-[45rem] rounded-full bg-primary-500/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary-400/10 blur-[120px]" />
            <div className="absolute top-[30%] left-[15%] w-[30rem] h-[30rem] rounded-full bg-coral-500/5 blur-[100px]" />
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto w-full min-h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.22, 1, 0.36, 1] // Custom smooth easing
                }}
                className="flex-1 flex flex-col h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
          
        </main>
      </div>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
};