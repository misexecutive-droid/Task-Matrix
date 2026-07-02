import { useState } from 'react';
import { Plus, Ticket as TicketIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components';
import { useTicketsQuery } from './hook';
import { TicketCard } from './TicketCard';
import { TicketForm } from './TicketForm';
import { TicketDetail } from './TicketDetail';
import type { Ticket, TicketStatus } from '../../api/ticket';

const STATUS_FILTERS: { key: TicketStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',         label: 'All'         },
  { key: 'OPEN',        label: 'Open'        },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'CLOSED',      label: 'Closed'      },
  { key: 'ON_HOLD',     label: 'On Hold'     },
  { key: 'OVERDUE',     label: 'Overdue'     },
  { key: 'ONTIME',      label: 'On Time'     },

];

export const TicketList = () => {
  const [showForm, setShowForm]         = useState(false);
  const [selected, setSelected]         = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [page, setPage]                 = useState(1);

  const { data, isPending, isError } = useTicketsQuery(page);
  const tickets  = data?.data ?? [];
  const meta     = data?.meta;

  const filtered = statusFilter === 'ALL'
    ? tickets
    : tickets.filter(t => t.status === statusFilter);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Tickets</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {meta?.total ?? 0} ticket{meta?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button  size="sm" variant="primary" className="gap-1.5 text-slate-600" onClick={() => setShowForm(true)}>
          <Plus size={14} className="text-slate-600" />
          New ticket
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit overflow-x-auto">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
            className={[
              'px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
              statusFilter === f.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm font-display">Loading tickets…</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-500 text-sm font-display">
          <AlertCircle size={15} />
          Failed to load tickets. Please refresh.
        </div>
      )}

      {/* Empty */}
      {!isPending && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <TicketIcon size={28} className="text-slate-300" />
          <p className="text-sm font-display">No tickets here.</p>
        </div>
      )}

      {/* List */}
      {!isPending && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-xs font-display rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 font-display">{page} / {meta.totalPages}</span>
          <button
            disabled={!meta.hasNext}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-xs font-display rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {showForm  && <TicketForm    onClose={() => setShowForm(false)}    />}
      {selected  && <TicketDetail  ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
