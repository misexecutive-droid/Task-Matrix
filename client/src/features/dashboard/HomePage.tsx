import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery, useDepartmentsQuery } from '../tickets/hook';
import { useTasksQuery, useComplianceReportQuery } from '../tasks/hook';
import { useUsersQuery } from '../admin/hook';
import { DashboardHeader } from './DashboardHeader';
import { DashboardOverview } from './DashboardOverview';
import { DepartmentBreakdown, type DepartmentRow } from './DepartmentBreakdown';
import { UserBreakdown, type UserRow } from './UserBreakdown';
import { RecentActivity } from './RecentActivity';
import { type FeedItem, lastMonths, countInMonth, trendFrom, pointDelta } from './dashboardDisplay';

export const HomePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1, 100);
  const { data: tasks, isPending: tasksPending } = useTasksQuery();
  const { data: departments } = useDepartmentsQuery();
  const { data: users } = useUsersQuery(isAdmin);
  const { data: complianceRows } = useComplianceReportQuery('month');

  const tickets = ticketPage?.data ?? [];
  const isPending = ticketsPending || tasksPending;

  // "now" only needs to be approximately current for the overdue checks below; memoized so
  // it's read once per mount, not on every render.
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);

  const feed: FeedItem[] = [
    ...tickets.map((t): FeedItem => ({ kind: 'ticket', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
    ...(tasks ?? []).map((t): FeedItem => ({ kind: 'task', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const departmentRows: DepartmentRow[] = (departments ?? []).map(dept => ({
    name: dept.name,
    openTickets: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED').length,
    openTasks: (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done').length,
    overdue: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length
      + (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length,
  }));

  const userRows: UserRow[] = (users ?? [])
    .map((u): UserRow => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName ?? ''}`.trim(),
      openTickets: tickets.filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'CLOSED').length,
      openTasks: (tasks ?? []).filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'done').length,
      overdue: tickets.filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length
        + (tasks ?? []).filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length,
    }))
    .filter(row => row.openTickets + row.openTasks > 0);

  // Overview widgets — counts/trends computed client-side from the tickets/tasks already fetched
  // above (each is already scoped server-side to what this role is allowed to see, so a non-admin
  // sees only their own numbers here without any extra filtering).
  const openTickets = tickets.filter(t => t.status !== 'CLOSED').length;
  const openTasks = (tasks ?? []).filter(t => t.status !== 'done').length;

  const ticketDates = tickets.map(t => t.createdAt);
  const taskDates = (tasks ?? []).map(t => t.createdAt);
  const [prevMonth, curMonth] = lastMonths(2);
  const ticketTrend = trendFrom(
    countInMonth(ticketDates, curMonth.year, curMonth.month),
    countInMonth(ticketDates, prevMonth.year, prevMonth.month),
  );
  const taskTrend = trendFrom(
    countInMonth(taskDates, curMonth.year, curMonth.month),
    countInMonth(taskDates, prevMonth.year, prevMonth.month),
  );

  const monthlyData = lastMonths(6).map(({ year, month, label }) => ({
    month: label,
    value: countInMonth(ticketDates, year, month) + countInMonth(taskDates, year, month),
  }));

  // Monthly Target gauge — checklist completion rate for the current month, from
  // /tasks/reports/compliance (role-scoped server-side: own tasks only for non-admin/PC).
  // Matched by exact "YYYY-MM" bucket key rather than array position, so a month with zero
  // checklist activity reads as "no data" instead of silently picking up an older bucket.
  const monthBucketKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`;
  const currentBucket = complianceRows?.find(r => r.bucket === monthBucketKey(curMonth.year, curMonth.month));
  const previousBucket = complianceRows?.find(r => r.bucket === monthBucketKey(prevMonth.year, prevMonth.month));
  const targetPercent = Math.round(currentBucket?.completionRate ?? 0);
  const targetChange = pointDelta(currentBucket?.completionRate ?? 0, previousBucket?.completionRate ?? 0);

  const totalItems = currentBucket?.totalItems ?? 0;
  const doneItems = currentBucket?.doneItems ?? 0;
  const pendingItems = totalItems - doneItems;
  const prevTotal = previousBucket?.totalItems ?? 0;
  const prevDone = previousBucket?.doneItems ?? 0;
  const prevPending = prevTotal - prevDone;

  const targetDescription = totalItems === 0
    ? "No checklist items recorded yet this month."
    : `${targetPercent}% of this month's checklist items are complete${
        previousBucket ? (targetPercent >= (previousBucket.completionRate ?? 0) ? " — ahead of last month's pace." : " — behind last month's pace.") : '.'
      }`;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px]">
      <DashboardHeader userName={user?.name} />

      <DashboardOverview
        isPending={isPending}
        openTickets={openTickets}
        openTasks={openTasks}
        ticketTrend={ticketTrend}
        taskTrend={taskTrend}
        monthlyData={monthlyData}
        targetPercent={targetPercent}
        targetChange={targetChange}
        targetDescription={targetDescription}
        targetStats={[
          { label: 'Target', value: String(totalItems), direction: totalItems >= prevTotal ? 'up' : 'down' },
          { label: 'Resolved', value: String(doneItems), direction: doneItems >= prevDone ? 'up' : 'down' },
          { label: 'Pending', value: String(pendingItems), direction: pendingItems <= prevPending ? 'up' : 'down' },
        ]}
      />

      {isAdmin && !isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DepartmentBreakdown rows={departmentRows} />
          <UserBreakdown rows={userRows} />
        </div>
      )}

      <RecentActivity feed={feed} isPending={isPending} />
    </div>
  );
};
