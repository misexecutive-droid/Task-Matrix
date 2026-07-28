import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery, useDepartmentsQuery } from '../tickets/hook';
import { useTasksQuery } from '../tasks/hook';
import { Skeleton } from '../../components';
import { StatusBarChart } from './StatusBarChart';
import { ActivityTrendChart } from './ActivityTrendChart';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStatsGrid } from './DashboardStatsGrid';
import { DepartmentBreakdown, type DepartmentRow } from './DepartmentBreakdown';
import { RecentActivity } from './RecentActivity';
import {
  TICKET_STATUS_ORDER,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_BAR_COLORS,
  TASK_STATUS_ORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_BAR_COLORS,
  dayKey,
  TREND_DAYS,
  type FeedItem,
} from './dashboardDisplay';

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

  const ticketStatusData = TICKET_STATUS_ORDER.map(status => ({
    label: TICKET_STATUS_LABELS[status],
    value: tickets.filter(t => t.status === status).length,
    colorClass: TICKET_STATUS_BAR_COLORS[status],
  }));

  const taskStatusData = TASK_STATUS_ORDER.map(status => ({
    label: TASK_STATUS_LABELS[status],
    value: (tasks ?? []).filter(t => t.status === status).length,
    colorClass: TASK_STATUS_BAR_COLORS[status],
  }));

  const trendData = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (TREND_DAYS - 1 - i));
    const key = dayKey(date);
    return {
      date,
      tickets: tickets.filter(t => dayKey(new Date(t.createdAt)) === key).length,
      tasks: (tasks ?? []).filter(t => dayKey(new Date(t.createdAt)) === key).length,
    };
  });

  const departmentRows: DepartmentRow[] = (departments ?? []).map(dept => ({
    name: dept.name,
    openTickets: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED').length,
    openTasks: (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done').length,
    overdue: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length
      + (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length,
  }));

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <DashboardHeader userName={user?.name} />

      <DashboardStatsGrid
        isPending={isPending}
        isAdmin={isAdmin}
        openTickets={openTickets}
        openTasks={openTasks}
        overdueCount={overdueCount}
        overdueTickets={overdueTickets}
        overdueTasks={overdueTasks}
        newTicketsThisWeek={newTicketsThisWeek}
        newTasksThisWeek={newTasksThisWeek}
      />

      {isAdmin && !isPending && <DepartmentBreakdown rows={departmentRows} />}

      {isPending ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatusBarChart title="Tickets by status" data={ticketStatusData} unit="ticket" />
          <StatusBarChart title="Tasks by status" data={taskStatusData} unit="task" />
        </div>
      )}

      {isPending ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <ActivityTrendChart title="Activity" data={trendData} />
      )}

      <RecentActivity feed={feed} isPending={isPending} />
    </div>
  );
};
