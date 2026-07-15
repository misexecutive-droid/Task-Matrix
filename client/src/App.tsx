import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { Dashboard } from './features/dashboard';
import { TaskList } from './features/tasks';
import { PublicLayout } from './components/layout';
import { TicketList, useTicketSocket } from './features/tickets';
import { useNotificationSocket } from './features/notifications/useNotificationSocket';
import { AdminLayout } from './features/admin/AdminLayout';
import { UserList } from './features/admin/UserList';
import { DepartmentList } from "./features/admin/DepartmentList"
import { ChecklistTemplateList } from "./features/admin/ChecklistTemplateList"
import { TatReport } from "./features/admin/TatReport"

const ProtectedRoute = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AuthRoute = () => {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

const AdminRoute = () => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />;
};

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <AuthRoute />,
        children: [
          { path: '/login', element: <LoginForm /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Dashboard />,
        children: [
          { path: '/', element: <p className="font-display text-slate-900">Welcome to TaskMatrix</p> },
          { path: '/tasks', element: <TaskList /> },
          { path: '/projects', element: <p className="font-display text-slate-600">Projects — coming soon</p> },
          { path: '/calendar', element: <p className="font-display text-slate-600">Calendar — coming soon</p> },
          { path: '/settings', element: <p className="font-display text-slate-600">Settings — coming soon</p> },
          { path: '/tickets', element: <TicketList /> },
          { path: '/dashboard', element: <Navigate to="/" replace /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: <TatReport /> },
              { path: '/admin/users', element: <UserList /> },
              { path: '/admin/departments', element: <DepartmentList /> },
              { path: '/admin/checklist-templates', element: <ChecklistTemplateList /> },
              { path: '/admin/tickets', element: <TicketList /> },
              { path: '/admin/settings', element: <p className="font-display text-slate-600">Settings — coming soon</p> },
            ],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  useTicketSocket();
  useNotificationSocket();
  return <RouterProvider router={router} />;
}
