import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery, useDepartmentsQuery } from '../tickets/hook';
import { useTasksQuery, useComplianceReportQuery } from '../tasks/hook';
import { useUsersQuery } from '../admin/hook';
import { useUpcomingEventsQuery } from '../events/hook';
import { DashboardHeader } from './DashboardHeader';
import { DashboardOverview } from './DashboardOverview';
import { MonthlyTargetCard, type FooterStat } from './MonthlyTargetCard';
import { DepartmentBreakdown, type DepartmentRow } from './DepartmentBreakdown';
import { UserBreakdown, type UserRow } from './UserBreakdown';
import { RecentActivity } from './RecentActivity';
import { UpcomingEvents } from './UpcomingEvents';
import { type FeedItem, type CompliancePeriod, PERIOD_LABEL, bucketKeyFor, shiftPeriod, pointDelta } from './dashboardDisplay';

export const HomePage = () => {
  const { user } = useAuth();
  // PC has the same org-wide dashboard access as ADMIN throughout this app.
  const hasFullAccess = user?.role === 'ADMIN' || user?.role === 'PC';
  const [period, setPeriod] = useState<CompliancePeriod>('month');
  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1, 100);
  const { data: tasks, isPending: tasksPending } = useTasksQuery();
  const { data: departments } = useDepartmentsQuery();
  const { data: users } = useUsersQuery(hasFullAccess);
  const { data: complianceRows } = useComplianceReportQuery(period);
  const { data: upcomingEvents, isPending: eventsPending } = useUpcomingEventsQuery(5);

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
    id: dept.id,
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

  // Target gauge — checklist completion rate for the selected period, from
  // /tasks/reports/compliance (role-scoped server-side: own tasks only for non-admin/PC).
  // Matched by exact bucket key (day/week/month/year, whichever is selected) rather than array
  // position, so a period with zero checklist activity reads as "no data" instead of silently
  // picking up an unrelated bucket.
  const nowDate = useMemo(() => new Date(now), [now]);
  const currentBucket = complianceRows?.find(r => r.bucket === bucketKeyFor(period, nowDate));
  const previousBucket = complianceRows?.find(r => r.bucket === bucketKeyFor(period, shiftPeriod(period, nowDate, -1)));
  const targetPercent = Math.round(currentBucket?.completionRate ?? 0);
  const targetChange = pointDelta(currentBucket?.completionRate ?? 0, previousBucket?.completionRate ?? 0);

  const totalItems = currentBucket?.totalItems ?? 0;
  const doneItems = currentBucket?.doneItems ?? 0;
  const pendingItems = totalItems - doneItems;
  const prevTotal = previousBucket?.totalItems ?? 0;
  const prevDone = previousBucket?.doneItems ?? 0;
  const prevPending = prevTotal - prevDone;

  const periodLabel = PERIOD_LABEL[period];
  const targetDescription = totalItems === 0
    ? `No checklist items recorded ${periodLabel}.`
    : `${targetPercent}% of ${periodLabel}'s checklist items are complete${
        previousBucket ? (targetPercent >= (previousBucket.completionRate ?? 0) ? " — ahead of the previous period's pace." : " — behind the previous period's pace.") : '.'
      }`;

  const targetStats: [FooterStat, FooterStat, FooterStat] = [
    { label: 'Target', value: String(totalItems), direction: totalItems >= prevTotal ? 'up' : 'down' },
    { label: 'Resolved', value: String(doneItems), direction: doneItems >= prevDone ? 'up' : 'down' },
    { label: 'Pending', value: String(pendingItems), direction: pendingItems <= prevPending ? 'up' : 'down' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in duration-500 ease-out">
      <DashboardHeader userName={user?.name} />

      <DashboardOverview isPending={isPending} tickets={tickets} tasks={tasks ?? []} />

      {/* Target pairs with By Department (both half-width) so neither sits alone in an empty
          row; By User then pairs with Recent Activity below it, matching the same half/half
          rhythm. Non-admins don't get the department/user breakdowns at all, so Target falls
          back to full width and Recent Activity keeps its original pairing with Upcoming
          Events. */}
      {hasFullAccess && !isPending ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyTargetCard
              percent={targetPercent}
              change={targetChange}
              description={targetDescription}
              stats={targetStats}
              period={period}
              onPeriodChange={setPeriod}
            />
            <DepartmentBreakdown rows={departmentRows} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserBreakdown rows={userRows} />
            <RecentActivity feed={feed} isPending={isPending} />
          </div>

          <div className="pb-8">
            <UpcomingEvents events={upcomingEvents ?? []} isPending={eventsPending} />
          </div>
        </>
      ) : (
        <>
          <MonthlyTargetCard
            percent={targetPercent}
            change={targetChange}
            description={targetDescription}
            stats={targetStats}
            period={period}
            onPeriodChange={setPeriod}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            <RecentActivity feed={feed} isPending={isPending} />
            <UpcomingEvents events={upcomingEvents ?? []} isPending={eventsPending} />
          </div>
        </>
      )}
    </div>
  );
};
