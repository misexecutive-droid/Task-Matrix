import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDepartmentsQuery, useTicketsQuery } from '../../tickets/hook';
import { useTasksQuery } from '../../tasks/hook';
import { useUsersQuery } from '../hook';
import { checklistInstanceApi } from '../../../api/checklistInstances';
import type { GroupBy } from './GroupByControl';

interface StoresPerformanceSectionProps {
  groupBy: GroupBy;
  from?: string;
  to?: string;
}

interface StoreRow {
  id: string;
  name: string;
  checklistRate: number | null;
  auditScore: number | null;
  openIssues: number;
  avgTat: number | null;
  slaMet: number | null;
}

interface LeaderRow {
  id: string;
  name: string;
  departmentName: string;
  score: number;
}

export const StoresPerformanceSection = ({ groupBy, from, to }: StoresPerformanceSectionProps) => {
  const { token } = useAuth();
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: ticketPage } = useTicketsQuery(1, 200);
  const { data: tasks = [] } = useTasksQuery();
  const { data: users = [] } = useUsersQuery(true);

  const tickets = useMemo(() => ticketPage?.data ?? [], [ticketPage]);

  // "Audit score" per row — recurring checklists are now store-scoped (see ChecklistDefinition),
  // not department-scoped, and there's no reliable department-to-store mapping to key off here.
  // Until this table itself is rebuilt around real stores, every row falls back to the same
  // org-wide completion rate the KPI sections above already show, rather than silently querying
  // with the wrong id and showing an always-empty score.
  const { data: auditRows } = useQuery({
    queryKey: ['analytics', 'checklist-instance-compliance', 'org-wide', groupBy, from, to],
    queryFn: () => checklistInstanceApi.getComplianceReport(groupBy, undefined, from, to).then((r) => r.data),
    enabled: !!token,
  });
  const latestAudit = auditRows?.[auditRows.length - 1];
  const auditScore = latestAudit?.completionRate != null ? Math.round(latestAudit.completionRate) : null;

  const storeRows: StoreRow[] = useMemo(
    () =>
      departments.map((dept) => {
        const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
        const deptTickets = tickets.filter((t) => t.departmentId === dept.id);

        const checklistRate =
          deptTasks.length > 0
            ? Math.round((deptTasks.filter((t) => t.status === 'done').length / deptTasks.length) * 100)
            : null;

        const openIssues = deptTickets.filter((t) => t.status !== 'CLOSED').length;

        const tatValues = deptTickets.map((t) => t.tatHours).filter((v): v is number => v != null);
        const avgTat =
          tatValues.length > 0
            ? Math.round((tatValues.reduce((sum, v) => sum + v, 0) / tatValues.length) * 10) / 10
            : null;

        const slaMet =
          deptTickets.length > 0
            ? Math.round(
                ((deptTickets.length - deptTickets.filter((t) => t.isOverdue).length) / deptTickets.length) * 100,
              )
            : null;

        return { id: dept.id, name: dept.name, checklistRate, auditScore, openIssues, avgTat, slaMet };
      }),
    [departments, tasks, tickets, auditScore],
  );

  const leaderboard: LeaderRow[] = useMemo(() => {
    const departmentName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? '—';
    // "now" only needs to be approximately current for the overdue checks below; memoized so
    // it's read once per mount, not on every render (see HomePage.tsx for the same pattern).
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    return users
      .map((u) => {
        const myTasks = tasks.filter((t) => t.assigneeId === u.id || t.userId === u.id);
        const myTickets = tickets.filter((t) => t.assigneeId === u.id || t.userId === u.id);
        const totalWork = myTasks.length + myTickets.length;
        if (totalWork === 0) return null;

        const completed =
          myTasks.filter((t) => t.status === 'done').length + myTickets.filter((t) => t.status === 'CLOSED').length;
        const overdue =
          myTasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length +
          myTickets.filter((t) => t.isOverdue).length;

        const score = Math.round(Math.max(0, (completed / totalWork) * 100 - (overdue / totalWork) * 20));

        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName ?? ''}`.trim(),
          departmentName: departmentName(u.departmentId),
          score,
        };
      })
      .filter((row): row is LeaderRow => row !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [users, tasks, tickets, departments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Store performance table */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="text-left font-display font-semibold px-5 py-3 whitespace-nowrap">Store</th>
                <th className="text-right font-display font-semibold px-5 py-3 whitespace-nowrap">Checklist</th>
                <th className="text-right font-display font-semibold px-5 py-3 whitespace-nowrap">Audit score</th>
                <th className="text-right font-display font-semibold px-5 py-3 whitespace-nowrap">Open issues</th>
                <th className="text-right font-display font-semibold px-5 py-3 whitespace-nowrap">Avg TAT</th>
                <th className="text-right font-display font-semibold px-5 py-3 whitespace-nowrap">SLA met</th>
              </tr>
            </thead>
            <tbody>
              {storeRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-text-muted font-display">
                    No department data yet.
                  </td>
                </tr>
              ) : (
                storeRows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-3 font-display font-medium text-text whitespace-nowrap">{row.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">
                      {row.checklistRate != null ? `${row.checklistRate}%` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">
                      {row.auditScore != null ? row.auditScore : '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">{row.openIssues}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">
                      {row.avgTat != null ? `${row.avgTat}h` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text">
                      {row.slaMet != null ? `${row.slaMet}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-coral-500" />
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text">Leaderboard</h3>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-text-muted font-display py-6 text-center">No activity yet.</p>
        ) : (
          leaderboard.map((row, index) => {
            const initials = row.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div key={row.id} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                <span className="w-5 text-xs font-display font-bold text-text-light tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="size-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-[11px] font-display font-bold shrink-0">
                  {initials}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-text truncate">{row.name}</p>
                  <p className="text-xs text-text-muted truncate">{row.departmentName}</p>
                </div>
                <span className="text-base font-display font-bold text-primary-700 tabular-nums">{row.score}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
