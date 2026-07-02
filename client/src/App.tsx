import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import { LoginForm }  from './features/auth/LoginForm';
import { SignupForm } from './features/auth/SignupForm';
import { Dashboard }  from './features/dashboard';
import { TaskList }   from './features/tasks';
import { PublicLayout } from './components/layout';   // ← add this
import { TicketList } from './features/tickets';

const ProtectedRoute = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AuthRoute = () => {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

const router = createBrowserRouter([
  {
    element: <PublicLayout />,         
    children: [
      {
        element: <AuthRoute />,
        children: [
          { path: '/login',  element: <LoginForm />  },
          { path: '/signup', element: <SignupForm /> },
        ],
      },
    ],
  },
  {
    // element: <ProtectedRoute />,
    children: [
      {
        element: <Dashboard />,
        children: [
          { path: '/',         element: <p className="font-display text-slate-600">Welcome to TaskMatrix</p> },
          { path: '/tasks',    element: <TaskList />                                                          },
          { path: '/projects', element: <p className="font-display text-slate-600">Projects — coming soon</p> },
          { path: '/calendar', element: <p className="font-display text-slate-600">Calendar — coming soon</p> },
          { path: '/settings', element: <p className="font-display text-slate-600">Settings — coming soon</p> },
          { path: '/tickets', element: <TicketList /> },
          { path: '/dashboard', element: <Navigate to="/" replace /> },
          
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
