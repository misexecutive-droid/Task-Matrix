import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useComplianceReportQuery } from '../tasks/hook';
import { CATEGORY_PREDICATES } from '../tasks/taskFilters';
import { CategoryBarChart, type CategoryBar } from './CategoryBarChart';
import { type CompliancePeriod, PERIOD_LABEL, bucketKeyFor, periodStartDate } from '../dashboard/dashboardDisplay';
import type { Task } from '../../api/task';
import type { Ticket } from '../../api/ticket';

interface PersonChecklistViewProps {
  personName: string;
  departmentName: string;
  departmentId: string;
  personId: string;
  tasks: Task[];
  tickets: Ticket[];
  onBack: () => void;
}

const PERIOD_OPTIONS: { key: CompliancePeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

const isPersons = (id: string | null, personId: string) => id === personId;

// Bar chart broken down by Direct Task / Issue / Delegation / Ticket / Todo Task, each bar
// clickable straight through to that person's filtered list for the selected period — reviewing
// one category no longer means re-deriving the filter by hand. Completion rate, compliance
// (photo-evidence) rate, and the Todo Task bar all come from the same checklist-completion
// aggregation the dashboard's Target card uses (task.service.ts's complianceReport), just scoped
// to this one person within this department.
export const PersonChecklistView = ({ personName, departmentName, departmentId, personId, tasks, tickets, onBack }: PersonChecklistViewProps) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<CompliancePeriod>('month');
  const { data: complianceRows, isPending } = useComplianceReportQuery(period, undefined, undefined, departmentId, personId);

  const now = useMemo(() => new Date(), []);
  const currentBucket = complianceRows?.find(r => r.bucket === bucketKeyFor(period, now));

  const completionRate = currentBucket?.completionRate ?? null;
  const complianceRate = currentBucket?.qualityRate ?? null;

  const periodTasks = useMemo(() => {
    const start = periodStartDate(period, now);
    return tasks.filter(t =>
      t.departmentId === departmentId
      && (isPersons(t.assigneeId, personId) || isPersons(t.userId, personId) || t.additionalAssigneeIds.includes(personId))
      && new Date(t.createdAt) >= start,
    );
  }, [tasks, personId, departmentId, period, now]);

  const periodTickets = useMemo(() => {
    const start = periodStartDate(period, now);
    return tickets.filter(t =>
      t.departmentId === departmentId
      && (isPersons(t.assigneeId, personId) || isPersons(t.userId, personId))
      && new Date(t.createdAt) >= start,
    );
  }, [tickets, personId, departmentId, period, now]);

  const goToTasks = (category: 'task' | 'issue' | 'delegation') =>
    navigate(`/tasks?assigneeIds=${personId}&category=${category}`);
  const goToTickets = () => navigate(`/tickets?assigneeIds=${personId}`);

  const countDoneTotal = (list: Task[]) => ({ done: list.filter(t => t.status === 'done').length, total: list.length });
  const taskStats = countDoneTotal(periodTasks.filter(CATEGORY_PREDICATES.task));
  const issueStats = countDoneTotal(periodTasks.filter(CATEGORY_PREDICATES.issue));
  const delegationStats = countDoneTotal(periodTasks.filter(CATEGORY_PREDICATES.delegation));
  const ticketStats = { done: periodTickets.filter(t => t.status === 'CLOSED').length, total: periodTickets.length };

  // Todo-list usage: how many of this person's checklist items (across all their tasks, any
  // category) are done vs total for the selected period — the same doneItems/totalItems the
  // Completion Rate card above already gets from complianceReport, just surfaced as its own bar.
  const todoStats = { done: currentBucket?.doneItems ?? 0, total: currentBucket?.totalItems ?? 0 };

  const bars: CategoryBar[] = [
    { key: 'task', label: 'Direct Task', barClassName: 'bg-primary-500', onClick: () => goToTasks('task'), ...taskStats },
    { key: 'issue', label: 'Issue', barClassName: 'bg-danger', onClick: () => goToTasks('issue'), ...issueStats },
    { key: 'delegation', label: 'Delegation', barClassName: 'bg-info', onClick: () => goToTasks('delegation'), ...delegationStats },
    { key: 'ticket', label: 'Ticket', barClassName: 'bg-coral-500', onClick: goToTickets, ...ticketStats },
    { key: 'todo', label: 'Todo Task', barClassName: 'bg-warning', onClick: () => navigate(`/tasks?assigneeIds=${personId}`), ...todoStats },
  ];

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text transition-colors cursor-pointer"
      >
        <ChevronLeft size={14} />
        Back to {departmentName}
      </button>

      {isPending ? (
        <div className="h-[340px] rounded-xl border border-border bg-surface animate-pulse" />
      ) : (
        <div className="rounded-xl border border-border/60 bg-surface p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-display font-semibold text-text tracking-tight">{personName}</h2>
              <p className="text-xs font-display text-text-muted mt-0.5">Checklist activity by type, {PERIOD_LABEL[period]}</p>
            </div>

            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-hover border border-border/50">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPeriod(opt.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-display font-medium transition-colors cursor-pointer ${
                    period === opt.key ? 'bg-surface text-text border border-border/60' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-hover/50">
              <span className="text-xs font-display text-text-muted font-medium">Completion Rate</span>
              <span className="text-2xl font-display font-bold text-text tabular-nums">
                {completionRate === null ? '—' : `${completionRate}%`}
              </span>
              <span className="text-[11px] text-text-muted">Checklist items marked done</span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-hover/50">
              <span className="text-xs font-display text-text-muted font-medium">Compliance Rate</span>
              <span className="text-2xl font-display font-bold text-text tabular-nums">
                {complianceRate === null ? '—' : `${complianceRate}%`}
              </span>
              <span className="text-[11px] text-text-muted">Required evidence photos uploaded</span>
            </div>
          </div>

          <CategoryBarChart bars={bars} />
        </div>
      )}
    </div>
  );
};
