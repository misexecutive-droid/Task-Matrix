import { useState } from 'react';
import { Plus, Ticket as TicketIcon, AlertCircle, Inbox, RotateCcw, Building2, User, FileDown } from 'lucide-react';
import { Button, PageNav } from '../../components';
import { useAuth } from '@/context/AuthContext';
import { useTicketsQuery, useDepartmentsQuery } from './hook';
import { TicketForm } from './TicketForm';
import { TicketDetail } from './TicketDetail';
import { ExportDialog } from '../reports';
import { TicketListControls } from './list/TicketListControls';
import { TicketListSkeleton } from './list/TicketListSkeleton';
import { TicketGroupedList } from './list/TicketGroupedList';
import {
  STATUS_FILTER_PREDICATES,
  SCOPE_FILTER_PREDICATES,
  SCOPE_FILTERS,
  type ScopeFilter,
  type FilterStatus,
} from './list/ticketFilters';
import { groupByDepartment, groupByAssignee } from './list/ticketGrouping';
import type { Ticket } from '../../api/ticket';

export const TicketList = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useTicketsQuery(page);
  const tickets = data?.data ?? [];
  const meta = data?.meta;
  const { data: departments } = useDepartmentsQuery();
  const departmentNames = new Map((departments ?? []).map(d => [d.id, d.name]));

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<'department' | 'assignee'>('department');

  const scopeFiltered = user
    ? tickets.filter(t => SCOPE_FILTER_PREDICATES[scopeFilter](t, user.id))
    : tickets;
  const statusFiltered = scopeFiltered.filter(STATUS_FILTER_PREDICATES[statusFilter]);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? statusFiltered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.description ?? '').toLowerCase().includes(query),
    )
    : statusFiltered;

  // Lookup map instead of a ternary — each grouping mode has its own builder function, so
  // adding a third grouping mode later is one more entry, not another branch.
  const GROUP_BUILDERS: Record<'department' | 'assignee', () => { key: string; label: string; tickets: Ticket[] }[]> = {
    department: () => groupByDepartment(filtered, departmentNames).map(g => ({
      key: g.departmentId ?? '__none__',
      label: g.departmentName,
      tickets: g.tickets,
    })),
    assignee: () => groupByAssignee(filtered).map(g => ({
      key: g.assigneeId ?? '__unassigned__',
      label: g.assigneeName,
      tickets: g.tickets,
    })),
  };
  const groups = GROUP_BUILDERS[groupBy]();

  const hasActiveFilters = search.length > 0 || statusFilter !== 'ALL' || scopeFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setScopeFilter('ALL');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full pb-10">

      {/* Page Header + Controls */}
      <div className="flex flex-col gap-4 pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center text-primary-500">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold text-text tracking-tight">
                Support Tickets
              </h1>
              <p className="text-xs text-text-muted font-display mt-0.5 flex items-center gap-1.5">
                <span>{meta?.total ?? 0} total record{meta?.total !== 1 ? 's' : ''}</span>
                {statusFilter !== 'ALL' && (
                  <span className="text-primary-500 font-medium">({filtered.length} matching filter)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Tabs */}
            <div className="flex gap-1 p-1 bg-surface-hover/70 rounded-full">
              {SCOPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => { setScopeFilter(f.key); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-display font-medium rounded-full transition-colors cursor-pointer ${
                    scopeFilter === f.key
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Group By Toggle */}
            <div className="flex gap-1 p-1 bg-surface-hover/70 rounded-full">
              <button
                type="button"
                onClick={() => setGroupBy('department')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-medium rounded-full transition-colors cursor-pointer ${
                  groupBy === 'department'
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Building2 size={12} /> Department
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('assignee')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-medium rounded-full transition-colors cursor-pointer ${
                  groupBy === 'assignee'
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <User size={12} /> Person
              </button>
            </div>

            {(user?.role === 'ADMIN' || user?.role === 'PC') && (
              <button
                type="button"
                onClick={() => setShowExport(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-display font-medium rounded-full border border-border/60 text-text-secondary hover:bg-surface-hover hover:text-text transition-all duration-200 cursor-pointer"
              >
                <FileDown size={14} />
                <span className="tracking-wide">Export</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-display font-semibold rounded-full text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.45)] active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              <Plus size={15} className="transition-transform duration-300 group-hover:scale-125" />
              <span className="tracking-wide">Create Ticket</span>
            </button>
          </div>
        </div>

        <TicketListControls
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={key => { setStatusFilter(key); setPage(1); }}
        />
      </div>

      {/* Loading Skeletons */}
      {isPending && <TicketListSkeleton />}

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-display">
          <AlertCircle size={16} className="shrink-0" />
          <span>Failed to load tickets. Please check your network connection and try again.</span>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border/70 rounded-xl bg-surface/30 text-center">
          <div className="mb-3 text-text-muted">
            <Inbox size={26} />
          </div>
          <h3 className="text-sm font-semibold text-text font-display">No tickets found</h3>
          <p className="text-xs text-text-muted font-display mt-1 max-w-xs">
            {hasActiveFilters
              ? 'No tickets matched your current search query or filter selection.'
              : 'There are currently no tickets registered in the system.'}
          </p>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 gap-1.5 text-xs font-display"
            >
              <RotateCcw size={13} />
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Ticket List Grouped by Department or Person */}
      {!isPending && !isError && filtered.length > 0 && (
        <TicketGroupedList
          groups={groups}
          groupBy={groupBy}
          onSelectTicket={setSelected}
          departmentNames={departmentNames}
        />
      )}

      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="pt-4 border-t border-border/40 flex justify-center">
          <PageNav page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Dialog Modals */}
      {showForm && <TicketForm onClose={() => setShowForm(false)} />}
      {showExport && (
        <ExportDialog
          reportModule="tickets"
          title="Export Tickets"
          description="Every ticket created in the selected period — status, priority, department, assignee, and TAT."
          onClose={() => setShowExport(false)}
        />
      )}
      {selected && <TicketDetail ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
