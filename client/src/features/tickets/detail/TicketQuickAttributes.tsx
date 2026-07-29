import { Tag, Sparkles, UserCheck, Clock, User, ChevronDown } from 'lucide-react';
import { Dropdown, type DropdownAction } from '../../../components';
import { getTicketStatusLabel } from '../../../lib/ticketStatusLabel';
import { STATUS_CONFIG, PRIORITY_CONFIG, STATUS_OPTIONS } from './detailConstants';
import type { Ticket } from '../../../api/ticket';
import type { Role } from '../../../api/auth';

interface TicketQuickAttributesProps {
  ticket: Ticket;
  currentUserRole: Role | undefined;
  canChangeStatus: boolean;
  isVerifier: boolean;
  canAssign: boolean;
  statusActions: DropdownAction[];
  assigneeActions: DropdownAction[];
  isOverdue: boolean;
}

export const TicketQuickAttributes = ({
  ticket,
  currentUserRole,
  canChangeStatus,
  isVerifier,
  canAssign,
  statusActions,
  assigneeActions,
  isOverdue,
}: TicketQuickAttributesProps) => {
  const statusStyle = STATUS_CONFIG[ticket.status];
  const priorityStyle = PRIORITY_CONFIG[ticket.priority];
  const statusLabel = getTicketStatusLabel(
    ticket.status,
    currentUserRole,
    STATUS_OPTIONS.find(s => s.value === ticket.status)?.label ?? ticket.status,
  );

  return (
    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-muted/40 border border-border/50">

      {/* Status Control */}
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
        <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
          <Tag size={11} /> Status
        </label>
        {canChangeStatus && isVerifier ? (
          <Dropdown
            align="start"
            items={statusActions}
            trigger={
              <button
                type="button"
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-all w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {statusLabel}
                <ChevronDown size={12} />
              </button>
            }
          />
        ) : (
          <span className={`text-xs font-semibold px-2 py-1 rounded-md border w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Priority Badge */}
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
        <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
          <Sparkles size={11} /> Priority
        </label>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md border w-fit ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
          {ticket.priority}
        </span>
      </div>

      {/* Assignee Selection */}
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
        <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
          <UserCheck size={11} /> Assignee
        </label>
        {canAssign ? (
          <Dropdown
            align="start"
            items={assigneeActions}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md border border-border bg-surface text-text cursor-pointer focus:outline-none w-fit"
              >
                {ticket.assignee ? (
                  <span className="flex items-center justify-center size-4.5 rounded-full bg-primary-600 text-white text-[9px] font-display font-semibold shrink-0">
                    {ticket.assignee.firstName.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <User size={12} className="text-text-muted" />
                )}
                {ticket.assignee ? ticket.assignee.firstName : 'Unassigned'}
                <ChevronDown size={12} />
              </button>
            }
          />
        ) : (
          <span className="text-xs text-text-secondary flex items-center gap-1.5 py-0.5">
            {ticket.assignee ? (
              <span className="flex items-center justify-center size-4.5 rounded-full bg-primary-600 text-white text-[9px] font-display font-semibold shrink-0">
                {ticket.assignee.firstName.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <User size={12} />
            )}
            {ticket.assignee ? ticket.assignee.firstName : 'Unassigned'}
          </span>
        )}
      </div>

      {/* SLA / Due Date Info */}
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
        <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
          <Clock size={11} /> SLA Deadline
        </label>
        {ticket.tatDueAt ? (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className={`text-xs font-medium ${isOverdue ? 'text-rose-500 font-bold' : 'text-text-secondary'}`}>
              {new Date(ticket.tatDueAt).toLocaleDateString()}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                OVERDUE
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-text-muted py-1">No SLA set</span>
        )}
      </div>

    </div>
  );
};
