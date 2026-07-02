import { useState } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Header, Footer, Sidebar } from '../../components/layout';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'var(--bg-body)' }}>

      <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />

      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={sidebarOpen} user={user} logout={logout} />

        <main className="flex-1 overflow-auto min-w-0 relative">

          
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 size-125 rounded-full bg-primary-400/10 blur-3xl" />
            <div className="absolute top-1/2 -left-48 size-100 rounded-full bg-indigo-400/8 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 size-87.5 rounded-full bg-primary-300/8 blur-3xl" />
          </div>

          <div className="relative z-10 p-6 lg:p-8">
            <Outlet />
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};