import { X, Clock, User, Loader2, Trash2 } from 'lucide-react';
import { useTicketQuery, useUpdateTicketMutation, useDeleteTicketMutation, useAssignableUsersQuery } from './hook';
import { ChecklistPanel } from './ChecklistPanel';
import { Button } from '../../components';
import { useAuth } from "../../context/AuthContext";
import type { Ticket, TicketStatus } from '../../api/ticket';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-slate-100  text-slate-600',
  IN_PROGRESS: 'bg-amber-50   text-amber-600',
  IN_REVIEW: 'bg-blue-50    text-blue-600',
  CLOSED: 'bg-emerald-50 text-emerald-600',
  ON_HOLD: 'bg-slate-100  text-slate-600',
};

const PRIORITY_COLORS: Record<Ticket['priority'], string> = {
  LOW: 'bg-slate-100  text-slate-500',
  MEDIUM: 'bg-amber-50   text-amber-600',
  HIGH: 'bg-orange-50  text-orange-600',
  CRITICAL: 'bg-red-50     text-red-600',
};

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketDetail = ({ ticket: initialTicket, onClose }: TicketDetailProps) => {
  const { data: fresh, isPending } = useTicketQuery(initialTicket.id);
  const ticket = fresh ?? initialTicket;
  const updateMut = useUpdateTicketMutation();
  const deleteMut = useDeleteTicketMutation();

  const { user: currentUser } = useAuth();
  const canAssign = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const isAdmin = currentUser?.role === "ADMIN";
  const canChangeStatus =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "MANAGER" ||
    (currentUser?.role === "AGENT" && ticket.assigneeId === currentUser?.id);
  const { data: assignableUsers } = useAssignableUsersQuery(ticket.departmentId ?? undefined);

  const handleDelete = () => {
    deleteMut.mutate(ticket.id, { onSuccess: onClose });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-body, #fff)' }}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200/60 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-display font-semibold text-slate-900 leading-snug">
              {ticket.title}
            </h2>
            <p className="text-xs text-slate-400 font-display mt-0.5">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {isPending && (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 size={18} className="animate-spin mr-2" />
              <span className="text-sm font-display">Loading…</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Selector */}
            {canChangeStatus ? (
              <select
                value={ticket.status}
                onChange={e =>
                  updateMut.mutate({ id: ticket.id, payload: { status: e.target.value as TicketStatus } })
                }
                className={`text-xs font-display font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300 ${STATUS_COLORS[ticket.status]}`}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <span className={`text-xs font-display font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[ticket.status]}`}>
                {STATUS_OPTIONS.find(s => s.value === ticket.status)?.label ?? ticket.status}
              </span>
            )}

            {/* Priority Badge */}
            <span className={`text-xs font-display font-medium px-2.5 py-1 rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>
              {ticket.priority}
            </span>

            {/* Assignee Control */}
            {canAssign ? (
              <select
                value={ticket.assigneeId ?? ''}
                onChange={e =>
                  updateMut.mutate({ id: ticket.id, payload: { assigneeId: e.target.value || null } })
                }
                className="text-xs font-display px-2.5 py-1 rounded-full border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Unassigned</option>
                {assignableUsers?.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</option>
                ))}
              </select>
            ) : (
              ticket.assignee && (
                <span className="flex items-center gap-1 text-xs text-slate-500 font-display">
                  <User size={11} />
                  {ticket.assignee.firstName}
                </span>
              )
            )}

            {/* Due Date Details */}
            {ticket.tatDueAt && (
              <span className={`flex items-center gap-1 text-xs font-display ${ticket.isOverdue && ticket.status !== 'CLOSED' ? 'text-red-500' : 'text-slate-400'}`}>
                <Clock size={11} />
                Due {new Date(ticket.tatDueAt).toLocaleDateString()}
              </span>
            )}

            {ticket.isOverdue && ticket.status !== 'CLOSED' && (
              <span className="text-xs font-display font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                Overdue
              </span>
            )}

            {ticket.tatHours && (
              <span className="text-xs text-slate-400 font-display">
                TAT: {ticket.tatHours}h
              </span>
            )}
          </div>

          {ticket.description && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm font-display text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          <ChecklistPanel ticketId={ticket.id} checklists={ticket.checklists} />

        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/60 shrink-0">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMut.isPending}
              className="mr-auto text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
            >
              <Trash2 size={13} />
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
};