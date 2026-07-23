import { useState } from 'react';
import {
  Plus,
  Ticket as TicketIcon,
  AlertCircle,
  Search,
  X,
  Building2,
  Filter,
  Inbox,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { Button, PageNav, Skeleton, Dropdown, type DropdownAction } from '../../components';
import { useTicketsQuery, useDepartmentsQuery } from './hook';
import { TicketCard } from './TicketCard';
import { TicketForm } from './TicketForm';
import { TicketDetail } from './TicketDetail';
import type { Ticket, TicketStatus } from '../../api/ticket';
import { useAuth } from '../../context/AuthContext';

const STATUS_FILTERS: { key: TicketStatus | 'ALL' | 'OVERDUE'; label: string }[] = [
  { key: 'ALL', label: 'All Tickets' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'OVERDUE', label: 'Overdue' },
];

// Groups tickets by departmentId, sorted alphabetically by department name with
// "No department" always last.
const groupByDepartment = (tickets: Ticket[], departmentNames: Map<string, string>) => {
  const groups = new Map<string, { departmentId: string | null; departmentName: string; tickets: Ticket[] }>();

  for (const ticket of tickets) {
    const key = ticket.departmentId ?? '__none__';
    if (!groups.has(key)) {
      groups.set(key, {
        departmentId: ticket.departmentId,
        departmentName: ticket.departmentId ? (departmentNames.get(ticket.departmentId) ?? 'Unknown Department') : 'General / Unassigned',
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
  const [search, setSearch] = useState('');

  const statusFiltered = statusFilter === 'ALL'
    ? tickets
    : statusFilter === 'OVERDUE'
      ? tickets.filter(t => t.isOverdue && t.status !== 'CLOSED')
      : tickets.filter(t => t.status === statusFilter);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? statusFiltered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.description ?? '').toLowerCase().includes(query),
    )
    : statusFiltered;

  const departmentGroups = groupByDepartment(filtered, departmentNames);
  const hasActiveFilters = search.length > 0 || statusFilter !== 'ALL';

  // Status filter menu — same trigger-button + action-list shape as the other
  // dropdowns in the app, replacing what used to be a row of scrollable tabs.
  const statusFilterActions: DropdownAction[] = STATUS_FILTERS.map(f => ({
    label: f.label,
    onClick: () => { setStatusFilter(f.key); setPage(1); },
  }));
  const activeFilterLabel = STATUS_FILTERS.find(f => f.key === statusFilter)?.label ?? 'All Tickets';

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-mono w-full pb-10">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-mono font-semibold text-text tracking-tight">
                Support Tickets
              </h1>
              <p className="text-xs text-text-muted font-mono mt-0.5 flex items-center gap-1.5">
                <span>{meta?.total ?? 0} total record{meta?.total !== 1 ? 's' : ''}</span>
                {statusFilter !== 'ALL' && (
                  <span className="text-primary-500 font-medium">({filtered.length} matching filter)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-[0_2px_10px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_16px_rgba(59,130,246,0.45)] active:scale-[0.97] transition-all duration-200 border border-white/15 cursor-pointer"
          >
            <Plus size={15} className="transition-transform duration-300 group-hover:scale-125" />
            <span className="tracking-wide">Create Ticket</span>
          </button>
        )}
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col gap-3 p-3 bg-surface/60 backdrop-blur-sm border border-border/60 rounded-xl shadow-xs">

        {/* Search Input */}
        <div className="relative w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets by title or content..."
            className="w-full pl-9 pr-9 py-2 text-xs font-mono bg-surface text-text rounded-lg border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-text-muted/60 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer transition-colors p-0.5 rounded-full hover:bg-surface-hover"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter size={11} /> Filter:
          </span>
          <Dropdown
            align="start"
            items={statusFilterActions}
            trigger={
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer whitespace-nowrap border w-fit ${statusFilter !== 'ALL'
                    ? 'bg-primary-500/15 text-primary-500 border-primary-500/30 shadow-2xs font-semibold'
                    : 'bg-surface/50 text-text-muted border-border/40 hover:bg-surface-hover hover:text-text'
                  }`}
              >
                {activeFilterLabel}
                <ChevronDown size={12} />
              </button>
            }
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-surface/50">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono">
          <AlertCircle size={16} className="shrink-0" />
          <span>Failed to load tickets. Please check your network connection and try again.</span>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border/70 rounded-xl bg-surface/30 text-center">
          <div className="p-3 rounded-full bg-surface-muted border border-border/60 text-text-muted mb-3">
            <Inbox size={26} />
          </div>
          <h3 className="text-sm font-semibold text-text font-mono">No tickets found</h3>
          <p className="text-xs text-text-muted font-mono mt-1 max-w-xs">
            {hasActiveFilters
              ? 'No tickets matched your current search query or filter selection.'
              : 'There are currently no tickets registered in the system.'}
          </p>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 gap-1.5 text-xs font-mono"
            >
              <RotateCcw size={13} />
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Ticket List Grouped by Department */}
      {!isPending && !isError && filtered.length > 0 && (() => {
        let cardIndex = 0;
        return (
          <div className="flex flex-col gap-6">
            {departmentGroups.map(group => (
              <div key={group.departmentId ?? '__none__'} className="flex flex-col gap-3">

                {/* Department Group Banner */}
                <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-primary-500 shrink-0" />
                    <h3 className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider">
                      {group.departmentName}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/50">
                    {group.tickets.length} {group.tickets.length === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="flex flex-col gap-3">
                  {group.tickets.map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={setSelected}
                      index={cardIndex++}
                      departmentName={group.departmentName}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="pt-4 border-t border-border/40 flex justify-center">
          <PageNav page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Dialog Modals */}
      {showForm && <TicketForm onClose={() => setShowForm(false)} />}
      {selected && <TicketDetail ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};