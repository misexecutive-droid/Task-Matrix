import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { ForgotPasswordForm } from './features/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';
import { Dashboard } from './features/dashboard';
import { HomePage } from './features/dashboard/HomePage';
import { PublicLayout } from './components/layout';
import { TicketList, useTicketSocket } from './features/tickets';
import { useNotificationSocket } from './features/notifications/useNotificationSocket';
import { AdminLayout } from './features/admin/AdminLayout';
import { UserList } from './features/admin/UserList';
import { DepartmentList } from "./features/admin/DepartmentList"
import { ChecklistTemplateList } from "./features/admin/ChecklistTemplateList"
import { TatReport } from "./features/admin/TatReport"
import { AdminTaskList } from './features/admin/AdminTaskList';
import { SettingsPage } from './features/admin/SettingsPage';
import { ChecklistDefinitionList, ChecklistDefinitionDetail, MyChecklists, ChecklistInstanceDetail } from './features/checklist';
import { MyErrorBoundary, NotFoundPage } from './components/error';

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
    errorElement: <MyErrorBoundary />,
    children: [
      {
        element: <AuthRoute />,
        children: [
          { path: '/login', element: <LoginForm /> },
          { path: '/forgot-password', element: <ForgotPasswordForm /> },
          { path: '/reset-password', element: <ResetPasswordForm /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <MyErrorBoundary />,
    children: [
      {
        element: <Dashboard />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/projects', element: <p className="font-display text-text-secondary">Projects — coming soon</p> },
          { path: '/calendar', element: <p className="font-display text-text-secondary">Calendar — coming soon</p> },
          { path: '/settings', element: <p className="font-display text-text-secondary">Settings — coming soon</p> },
          { path: '/tickets', element: <TicketList /> },
          { path: '/checklists', element: <MyChecklists /> },
          { path: '/checklists/:instanceId', element: <ChecklistInstanceDetail /> },
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
              { path: '/admin/scheduled-checklists', element: <ChecklistDefinitionList /> },
              { path: '/admin/scheduled-checklists/:definitionId', element: <ChecklistDefinitionDetail /> },
              { path: '/admin/tickets', element: <TicketList /> },
              { path: '/admin/tasks', element: <AdminTaskList /> },
              { path: '/admin/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  useTicketSocket();
  useNotificationSocket();
  return <RouterProvider router={router} />;
}
  