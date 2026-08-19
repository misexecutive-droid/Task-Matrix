import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { ForgotPasswordForm } from './features/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';
import { Dashboard } from './features/dashboard';
import { HomePage } from './features/dashboard/HomePage';
import { PublicLayout } from './components/layout';
import { TicketList, useTicketSocket } from './features/tickets';
import { TaskList, useTaskSocket } from './features/tasks';
import { useNotificationSocket } from './features/notifications/useNotificationSocket';
import { AdminLayout } from './features/admin/AdminLayout';
import { DirectoryPage } from './features/admin/directory';
import { ChecklistTemplateList } from './features/admin/checklistTemplate';
import { OrgStructurePage } from './features/admin/orgStructure';
import { TatReport } from './features/admin/report';
import { AdminTaskList } from './features/admin/AdminTaskList';
import { OrgOverview } from './features/admin/analytics';
import { SettingsPage } from './features/admin/SettingsPage';
import { ChecklistTemplatesGrid, ChecklistDefinitionDetail, ChecklistBuilder, MyChecklists, ChecklistInstanceDetail } from './features/checklist';
import { VerificationQueue } from './features/verification';
import { MyErrorBoundary, NotFoundPage } from './components/error';
import { CategoryList, SettingsLayout } from './features/settings';
import { ReportsPage } from './features/reports';
import { EventList } from './features/events';
import { TeamOverviewPage } from './features/team/TeamOverviewPage';
import { TodoPage } from './features/todo';

const ProtectedRoute = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AuthRoute = () => {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

// PC has full parity with ADMIN throughout this app, so it gets the same access to every
// /admin/* page too.
const AdminRoute = () => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'ADMIN' || user?.role === 'PC' ? <Outlet /> : <Navigate to="/" replace />;
};

const PCRoute = () => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'PC' || user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />;
};

// MANAGER (department-scoped) and SENIOR (store-scoped) reach the same merged Overview/Analytics
// page ADMIN/PC get at /admin, but from a route under the regular Dashboard shell instead of
// AdminLayout — they don't get the org-management tools (Users/Stores/Departments/Settings) that
// shell exposes.
const AnalyticsRoute = () => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'MANAGER' || user?.role === 'SENIOR' ? <Outlet /> : <Navigate to="/" replace />;
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
          { 
            path: '/settings', 
            element: <SettingsLayout/>, 
            children : [
              { index : true, element : <Navigate to="/settings/categories" replace />},
              { path : "categories", element : <CategoryList/>}

          ] },
          { path: '/tickets', element: <TicketList /> },
          { path: '/tasks', element: <TaskList /> },
          { path: '/todo', element: <TodoPage /> },
          { path: '/events', element: <EventList /> },
          { path: '/checklists', element: <MyChecklists /> },
          { path: '/checklists/:instanceId', element: <ChecklistInstanceDetail /> },
          { path: '/dashboard', element: <Navigate to="/" replace /> },
          {
            element: <AnalyticsRoute />,
            children: [
              { path: '/analytics', element: <OrgOverview /> },
            ],
          },
          {
            element: <PCRoute />,
            children: [
              { path: '/verify', element: <VerificationQueue /> },
              // Org-wide task browser (department/person/day/status filters) — PC and ADMIN
              // both need this, so it lives here instead of under AdminRoute/AdminLayout,
              // which is gated to ADMIN only.
              { path: '/tasks/team', element: <AdminTaskList /> },
              // Department -> person -> checklist drill-down — same PC/ADMIN audience as above.
              { path: '/team', element: <TeamOverviewPage /> },
            ],
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: <OrgOverview /> },
              { path: '/admin/analytics', element: <Navigate to="/admin" replace /> },
              { path: '/admin/reports/tasks', element: <TatReport /> },
              { path: '/admin/directory', element: <DirectoryPage /> },
              { path: '/admin/users', element: <Navigate to="/admin/directory" replace /> },
              { path: '/admin/departments', element: <Navigate to="/admin/directory" replace /> },
              { path: '/admin/stores', element: <Navigate to="/admin/directory" replace /> },
              { path: '/admin/org-structure', element: <OrgStructurePage /> },
              { path: '/admin/checklist-templates', element: <ChecklistTemplateList /> },
              { path: '/admin/scheduled-checklists', element: <ChecklistTemplatesGrid /> },
              { path: '/admin/scheduled-checklists/builder', element: <ChecklistBuilder /> },
              { path: '/admin/scheduled-checklists/builder/:definitionId', element: <ChecklistBuilder /> },
              { path: '/admin/scheduled-checklists/:definitionId', element: <ChecklistDefinitionDetail /> },
              { path: '/admin/tickets', element: <TicketList /> },
              { path: '/admin/reports', element: <ReportsPage /> },
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
  useTaskSocket();
  useNotificationSocket();
  return <RouterProvider router={router} />;
}
  