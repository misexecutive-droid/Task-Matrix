import { Clock, ChevronRight } from 'lucide-react';
import type { Ticket } from '../../api/ticket';

const STATUS_STYLES: Record<Ticket['status'], string> = {
  OPEN: 'bg-surface-hover text-text-secondary',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  IN_REVIEW: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  CLOSED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ON_HOLD: 'bg-surface-hover text-text-secondary',
};

const STATUS_LABELS: Record<Ticket['status'], string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  CLOSED: 'Closed',
  ON_HOLD: 'On Hold',
};

const PRIORITY_STYLES: Record<Ticket['priority'], string> = {
  LOW: 'bg-surface-hover text-text-muted',
  MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  HIGH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  CRITICAL: 'bg-danger/10 text-danger',
};

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const totalItems = ticket.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = ticket.checklists.reduce((s, c) => s + c.items.filter(i => i.isDone).length, 0);
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : null;
  const isOverdue = ticket.isOverdue && ticket.status !== 'CLOSED';


  return (
    <button
      onClick={() => onClick(ticket)}
      className="w-full text-left flex items-start gap-4 px-4 py-3.5 rounded-lg border border-border bg-surface hover:border-primary-400 hover:shadow-sm transition-all group cursor-pointer"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* Title + chevron */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-display font-medium text-text leading-snug line-clamp-1">
            {ticket.title}
          </p>
          <ChevronRight
            size={14}
            className="text-text-light group-hover:text-text-secondary shrink-0 mt-0.5 transition-colors"
          />
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority]}`}>
            {ticket.priority}
          </span>
          {ticket.assignee && (
            <span className="text-xs text-text-muted font-display">
              → {ticket.assignee.firstName}
            </span>
          )}
        </div>

        {/* Checklist progress */}
        {progress !== null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted font-display shrink-0">
              {doneItems}/{totalItems}
            </span>
          </div>
        )}
      </div>

      {/* TAT due date */}
      {ticket.tatDueAt && (
        <div className={`flex items-center gap-1 text-xs font-display shrink-0 mt-0.5 ${isOverdue ? 'text-danger' : 'text-text-muted'}`}>
          <Clock size={11} />
          {new Date(ticket.tatDueAt).toLocaleDateString()}
        </div>
      )}
    </button>
  );
};
