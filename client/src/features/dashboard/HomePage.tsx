import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery, useDepartmentsQuery } from '../tickets/hook';
import { useTasksQuery } from '../tasks/hook';
import { DashboardHeader } from './DashboardHeader';
import { DashboardOverview } from './DashboardOverview';
import { DepartmentBreakdown, type DepartmentRow } from './DepartmentBreakdown';
import { RecentActivity } from './RecentActivity';
import { dayKey, TREND_DAYS, type FeedItem } from './dashboardDisplay';

export const HomePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1, 100);
  const { data: tasks, isPending: tasksPending } = useTasksQuery();
  const { data: departments } = useDepartmentsQuery();

  const tickets = ticketPage?.data ?? [];
  const isPending = ticketsPending || tasksPending;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const openTickets = tickets.filter(t => t.status !== 'CLOSED').length;
  const openTasks = (tasks ?? []).filter(t => t.status !== 'done').length;
  const overdueTickets = tickets.filter(t => t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length;
  const overdueTasks = (tasks ?? []).filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length;
  const overdueCount = overdueTickets + overdueTasks;
  const newTicketsThisWeek = tickets.filter(t => new Date(t.createdAt).getTime() >= weekAgo).length;
  const newTasksThisWeek = (tasks ?? []).filter(t => new Date(t.createdAt).getTime() >= weekAgo).length;

  const feed: FeedItem[] = [
    ...tickets.map((t): FeedItem => ({ kind: 'ticket', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
    ...(tasks ?? []).map((t): FeedItem => ({ kind: 'task', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const trendDays = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (TREND_DAYS - 1 - i));
    return date;
  });

  const trendTickets = trendDays.map(date => {
    const key = dayKey(date);
    return tickets.filter(t => dayKey(new Date(t.createdAt)) === key).length;
  });
  const trendTasks = trendDays.map(date => {
    const key = dayKey(date);
    return (tasks ?? []).filter(t => dayKey(new Date(t.createdAt)) === key).length;
  });
  // "Overdue as of that day" approximated from current status — items not yet closed/done
  // whose due date had already passed by end of that day. Imperfect for items resolved
  // mid-window (no status-history to look back on), but close enough for a trend line.
  const trendOverdue = trendDays.map(date => {
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const t1 = tickets.filter(t => t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < dayEnd.getTime()).length;
    const t2 = (tasks ?? []).filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < dayEnd.getTime()).length;
    return t1 + t2;
  });
  const trendNew = trendDays.map((_, i) => trendTickets[i] + trendTasks[i]);

  const departmentRows: DepartmentRow[] = (departments ?? []).map(dept => ({
    name: dept.name,
    openTickets: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED').length,
    openTasks: (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done').length,
    overdue: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length
      + (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <DashboardHeader userName={user?.name} />

      <DashboardOverview
        isPending={isPending}
        isAdmin={isAdmin}
        openTickets={openTickets}
        openTasks={openTasks}
        overdueCount={overdueCount}
        newThisWeek={newTicketsThisWeek + newTasksThisWeek}
        dates={trendDays}
        trendTickets={trendTickets}
        trendTasks={trendTasks}
        trendOverdue={trendOverdue}
        trendNew={trendNew}
      />

      <div className={isAdmin ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
        {isAdmin && !isPending && <DepartmentBreakdown rows={departmentRows} />}
        <RecentActivity feed={feed} isPending={isPending} />
      </div>
    </div>
  );
};
