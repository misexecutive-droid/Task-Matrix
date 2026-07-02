import { Clock, ChevronRight } from 'lucide-react';
import type { Ticket } from '../../api/ticket';

const STATUS_STYLES: Record<Ticket['status'], string> = {
  OPEN:        'bg-slate-100  text-slate-600',
  IN_PROGRESS: 'bg-amber-50   text-amber-600',
  CLOSED:      'bg-emerald-50 text-emerald-600',
  ON_HOLD :    'bg-slate-100  text-slate-600',
  OVERDUE:     'bg-red-50     text-red-600',
  ONTIME :  'bg-emerald-50 text-emerald-600',
};

const STATUS_LABELS: Record<Ticket['status'], string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',

  CLOSED:      'Closed',
  ON_HOLD :    'On Hold',
  OVERDUE:     'Overdue',
  ONTIME :  'On Time',

};

const PRIORITY_STYLES: Record<Ticket['priority'], string> = {
  LOW:      'bg-slate-100  text-slate-500',
  MEDIUM:   'bg-amber-50   text-amber-600',
  HIGH:     'bg-orange-50  text-orange-600',
  CRITICAL: 'bg-red-50     text-red-600',
};

interface TicketCardProps {
  ticket:  Ticket;
  onClick: (ticket: Ticket) => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const totalItems = ticket.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems  = ticket.checklists.reduce((s, c) => s + c.items.filter(i => i.isDone).length, 0);
  const progress   = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : null;
  const isOverdue  = ticket.tatDueAt
    && new Date(ticket.tatDueAt) < new Date()
    && ticket.status !== 'CLOSED';

  return (
    <button
      onClick={() => onClick(ticket)}
      className="w-full text-left flex items-start gap-4 px-4 py-3.5 rounded-lg border border-slate-200/70 bg-white hover:border-primary-300 hover:shadow-sm transition-all group cursor-pointer"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* Title + chevron */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-display font-medium text-slate-800 leading-snug line-clamp-1">
            {ticket.title}
          </p>
          <ChevronRight
            size={14}
            className="text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5 transition-colors"
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
            <span className="text-xs text-slate-400 font-display">
              → {ticket.assignee.firstName}
            </span>
          )}
        </div>

        {/* Checklist progress */}
        {progress !== null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-display shrink-0">
              {doneItems}/{totalItems}
            </span>
          </div>
        )}
      </div>

      {/* TAT due date */}
      {ticket.tatDueAt && (
        <div className={`flex items-center gap-1 text-xs font-display shrink-0 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Clock size={11} />
          {new Date(ticket.tatDueAt).toLocaleDateString()}
        </div>
      )}
    </button>
  );
};
