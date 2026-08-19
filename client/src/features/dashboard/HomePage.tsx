import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTicketsQuery } from '../tickets/hook';
import { useTasksQuery } from '../tasks/hook';
import { useUpcomingEventsQuery } from '../events/hook';
import { TASK_SCORE } from '../tasks/taskDisplay';
import { DashboardHeader } from './DashboardHeader';
import { DashboardOverview } from './DashboardOverview';
import { MonthlyTargetCard, type FooterStat } from './MonthlyTargetCard';
import { RecentActivity } from './RecentActivity';
import { UpcomingEvents } from './UpcomingEvents';
import { type FeedItem, type CompliancePeriod, PERIOD_LABEL, periodStartDate, shiftPeriod, pointDelta } from './dashboardDisplay';
import type { Task } from '../../api/task';

export const HomePage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<CompliancePeriod>('month');
  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1, 100);
  const { data: allTasks, isPending: tasksPending } = useTasksQuery();
  const { data: upcomingEvents, isPending: eventsPending } = useUpcomingEventsQuery(5);

  const isPending = ticketsPending || tasksPending;

  // This is everyone's dashboard homepage, not just admin's — regardless of role, it should only
  // ever reflect the signed-in user's own work (raised by them or assigned to them), never
  // org-wide totals. ADMIN/PC's queries above return every ticket/task server-side, so the "mine"
  // filter has to happen here rather than relying on server-side role scoping.
  const tickets = (ticketPage?.data ?? []).filter((t) => t.userId === user?.id || t.assigneeId === user?.id);
  const tasks = (allTasks ?? []).filter(
    (t) => t.userId === user?.id || t.assigneeId === user?.id || t.additionalAssigneeIds?.includes(user?.id ?? ''),
  );

  // "now" only needs to be approximately current for the overdue checks below; memoized so
  // it's read once per mount, not on every render.
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);

  const feed: FeedItem[] = [
    ...tickets.map((t): FeedItem => ({ kind: 'ticket', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
    ...tasks.map((t): FeedItem => ({ kind: 'task', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Target gauge — weighted completion of MY delegations for the selected period. Each task
  // contributes TASK_SCORE[status] — Done = 1, In Progress/Pending Verification = 0.5, Todo = 0,
  // regardless of whether it's overdue — so the percent reflects real progress, not just a binary
  // done/not-done count.
  const nowDate = useMemo(() => new Date(now), [now]);
  const tasksCreatedIn = (periodDate: Date) => {
    const start = periodStartDate(period, periodDate).getTime();
    const end = periodStartDate(period, shiftPeriod(period, periodDate, 1)).getTime();
    return tasks.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      return created >= start && created < end;
    });
  };
  const weightedScorePercent = (list: Task[]) =>
    list.length ? (list.reduce((sum, t) => sum + TASK_SCORE[t.status], 0) / list.length) * 100 : 0;

  const currentTasks = tasksCreatedIn(nowDate);
  const previousTasks = tasksCreatedIn(shiftPeriod(period, nowDate, -1));
  const targetPercent = Math.round(weightedScorePercent(currentTasks));
  const previousPercent = Math.round(weightedScorePercent(previousTasks));
  const targetChange = pointDelta(targetPercent, previousPercent);

  const totalItems = currentTasks.length;
  const doneItems = currentTasks.filter((t) => t.status === 'done').length;
  const pendingItems = totalItems - doneItems;
  const prevTotal = previousTasks.length;
  const prevDone = previousTasks.filter((t) => t.status === 'done').length;
  const prevPending = prevTotal - prevDone;

  const periodLabel = PERIOD_LABEL[period];
  const targetDescription = totalItems === 0
    ? `No delegations created ${periodLabel}.`
    : `${targetPercent}% weighted completion of ${periodLabel}'s delegations${
        prevTotal ? (targetPercent >= previousPercent ? " — ahead of the previous period's pace." : " — behind the previous period's pace.") : '.'
      }`;

  const targetStats: [FooterStat, FooterStat, FooterStat] = [
    { label: 'Target', value: String(totalItems), direction: totalItems >= prevTotal ? 'up' : 'down' },
    { label: 'Resolved', value: String(doneItems), direction: doneItems >= prevDone ? 'up' : 'down' },
    { label: 'Pending', value: String(pendingItems), direction: pendingItems <= prevPending ? 'up' : 'down' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in duration-500 ease-out">
      <DashboardHeader userName={user?.name} />

      <DashboardOverview isPending={isPending} tickets={tickets} tasks={tasks} />

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
    </div>
  );
};
