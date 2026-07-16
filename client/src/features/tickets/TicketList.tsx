import { useState } from 'react';
import { Plus, Ticket as TicketIcon, AlertCircle } from 'lucide-react';
import { Button, PageNav, Skeleton } from '../../components';
import { useTicketsQuery, useDepartmentsQuery } from './hook';
import { TicketCard } from './TicketCard';
import { TicketForm } from './TicketForm';
import { TicketDetail } from './TicketDetail';
import type { Ticket, TicketStatus } from '../../api/ticket';
import { useAuth } from '../../context/AuthContext';

const STATUS_FILTERS: { key: TicketStatus | 'ALL' | 'OVERDUE'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'OVERDUE', label: 'Overdue' },
];

// Groups tickets by departmentId, sorted alphabetically by department name with
// "No department" always last — same convention as tasks/TaskList.tsx's groupByDepartment.
const groupByDepartment = (tickets: Ticket[], departmentNames: Map<string, string>) => {
  const groups = new Map<string, { departmentId: string | null; departmentName: string; tickets: Ticket[] }>();

  for (const ticket of tickets) {
    const key = ticket.departmentId ?? '__none__';
    if (!groups.has(key)) {
      groups.set(key, {
        departmentId: ticket.departmentId,
        departmentName: ticket.departmentId ? (departmentNames.get(ticket.departmentId) ?? 'Unknown department') : 'No department',
        tickets: [],
      });
    }
    groups.get(key)!.tickets.push(ticket);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.departmentId === null) return 1;
    if (b.departmentId === null) return -1;
    return a.departmentName.localeCompare(b.departmentName);
  });
};


export const TicketList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useTicketsQuery(page);
  const tickets = data?.data ?? [];
  const meta = data?.meta;
  const { data: departments } = useDepartmentsQuery();
  const departmentNames = new Map((departments ?? []).map(d => [d.id, d.name]));

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL' | 'OVERDUE'>('ALL');
  const filtered = statusFilter === 'ALL'
    ? tickets
    : statusFilter === 'OVERDUE'
      ? tickets.filter(t => t.isOverdue && t.status !== 'CLOSED')
      : tickets.filter(t => t.status === statusFilter);

  const departmentGroups = groupByDepartment(filtered, departmentNames);


  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-text">Tickets</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {meta?.total ?? 0} ticket{meta?.total !== 1 ? 's' : ''}
          </p>
        </div>
        {
          isAdmin && (
            <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              New ticket
            </Button>
          )
        }
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-surface-hover rounded-lg w-fit overflow-x-auto max-w-full">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
            className={[
              'px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
              statusFilter === f.key
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-3.5 rounded-lg border border-border bg-surface">
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <Skeleton className="h-4 w-2/3 max-w-80" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          <AlertCircle size={15} />
          Failed to load tickets. Please refresh.
        </div>
      )}

      {/* Empty */}
      {!isPending && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
          <TicketIcon size={28} className="text-text-light" />
          <p className="text-sm font-display">No tickets here.</p>
        </div>
      )}

      {/* List, grouped by department */}
      {!isPending && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-5">
          {departmentGroups.map(group => (
            <div key={group.departmentId ?? '__none__'} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-display font-semibold text-text-muted uppercase tracking-wide">
                  {group.departmentName}
                </h3>
                <span className="text-xs text-text-light font-display">{group.tickets.length}</span>
              </div>
              {group.tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onClick={setSelected} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <PageNav page={page} totalPages={meta.totalPages} onPageChange={setPage} className="pt-2" />
      )}

      {showForm && <TicketForm onClose={() => setShowForm(false)} />}
      {selected && <TicketDetail ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
