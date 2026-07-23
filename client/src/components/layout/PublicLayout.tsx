import { Header } from './Header';
import { Footer } from './Footer';
import { Outlet } from 'react-router';

export const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-svh bg-background text-text transition-colors duration-200">
      <Header />

      <main 
        id="main-content" 
        className="flex-1 w-full focus-visible:outline-none"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};