import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Building2 } from 'lucide-react';
import { useTicketsQuery, useDepartmentsQuery } from '../tickets/hook';
import { useTasksQuery } from '../tasks/hook';
import { useUsersQuery } from '../admin/hook';
import { Skeleton } from '../../components';
import { DepartmentCard, type DepartmentCardRow } from './DepartmentCard';
import { PersonCard, type PersonCardRow } from './PersonCard';
import { PersonChecklistView } from './PersonChecklistView';

// Department -> Person -> Checklist drill-down for ADMIN/PC (both have full org-wide access —
// see App.tsx's AdminRoute). State lives in the URL (departmentId/personId) rather than plain
// useState so back/forward and refresh land on the same drill-down level instead of always
// resetting to the department grid (the same bug class fixed on the Tasks filters — see
// TaskList.tsx's syncFiltersToUrl).
export const TeamOverviewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentId = searchParams.get('departmentId');
  const personId = searchParams.get('personId');

  const { data: departments, isPending: departmentsPending } = useDepartmentsQuery();
  const { data: users, isPending: usersPending } = useUsersQuery(true);
  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1, 100);
  const { data: tasks, isPending: tasksPending } = useTasksQuery();

  const tickets = useMemo(() => ticketPage?.data ?? [], [ticketPage]);
  const isPending = departmentsPending || usersPending || ticketsPending || tasksPending;

  // "now" only needs to be approximately current for the overdue checks below; memoized so
  // it's read once per mount, not on every render (see HomePage.tsx for the same pattern).
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);

  const departmentRows: DepartmentCardRow[] = useMemo(() => (departments ?? []).map(dept => ({
    id: dept.id,
    name: dept.name,
    headcount: (users ?? []).filter(u => u.departmentId === dept.id).length,
    openTickets: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED').length,
    openTasks: (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done').length,
    overdue: tickets.filter(t => t.departmentId === dept.id && t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length
      + (tasks ?? []).filter(t => t.departmentId === dept.id && t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length,
  })), [departments, users, tickets, tasks, now]);

  const selectedDepartment = departmentRows.find(d => d.id === departmentId);

  const personRows: PersonCardRow[] = useMemo(() => (users ?? [])
    .filter(u => u.departmentId === departmentId)
    .map((u): PersonCardRow => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName ?? ''}`.trim(),
      role: u.role,
      openTickets: tickets.filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'CLOSED').length,
      openTasks: (tasks ?? []).filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'done').length,
      overdue: tickets.filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'CLOSED' && t.tatDueAt && new Date(t.tatDueAt).getTime() < now).length
        + (tasks ?? []).filter(t => (t.assigneeId === u.id || t.userId === u.id) && t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now).length,
    })), [users, departmentId, tickets, tasks, now]);

  const selectedPerson = personRows.find(p => p.id === personId);

  const openDepartment = (id: string) => setSearchParams({ departmentId: id });
  const openPerson = (id: string) => setSearchParams({ departmentId: departmentId ?? '', personId: id });
  const backToDepartments = () => setSearchParams({});
  const backToPeople = () => setSearchParams({ departmentId: departmentId ?? '' });

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center text-primary-500">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold text-text tracking-tight">Team Overview</h1>
          <p className="text-xs text-text-muted font-display mt-0.5">
            {!departmentId
              ? 'Every department, org-wide.'
              : !personId
                ? `People in ${selectedDepartment?.name ?? '…'}`
                : `${selectedPerson?.name ?? '…'}'s checklist completion`}
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !departmentId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentRows.map(row => (
            <DepartmentCard key={row.id} row={row} onClick={() => openDepartment(row.id)} />
          ))}
        </div>
      ) : !personId ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={backToDepartments}
            className="self-start text-xs font-semibold text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            ← All departments
          </button>

          {personRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border/70 rounded-xl bg-surface/30 text-center">
              <p className="text-sm text-text-muted font-display">No one is assigned to this department yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {personRows.map(row => (
                <PersonCard key={row.id} row={row} onClick={() => openPerson(row.id)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <PersonChecklistView
          personName={selectedPerson?.name ?? 'This person'}
          departmentName={selectedDepartment?.name ?? 'department'}
          departmentId={departmentId}
          personId={personId}
          tasks={tasks ?? []}
          tickets={tickets}
          onBack={backToPeople}
        />
      )}
    </div>
  );
};
