import {
  Clock,
  ChevronRight,
  Ticket as TicketIcon,
  User,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import type { Ticket } from '../../api/ticket';
import { getChecklistProgress } from '../../lib/checklistProgress';
import { getTicketStatusLabel } from '../../lib/ticketStatusLabel';
import { getInitials } from '../../lib/getInitials';
import { useAuth } from '../../context/AuthContext';

// Priority configuration with rich icon backgrounds, borders, and dark-mode support
const PRIORITY_CONFIG: Record<Ticket['priority'], {
  iconBg: string;
  badge: string;
  label: string;
}> = {
  LOW: {
    iconBg: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
    badge: 'border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/5',
    label: 'Low',
  },
  MEDIUM: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    badge: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
    label: 'Medium',
  },
  HIGH: {
    iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    badge: 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/5',
    label: 'High',
  },
  CRITICAL: {
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    badge: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 font-bold',
    label: 'Critical',
  },
};

// Status badge styles with colored indicator dots
const STATUS_CONFIG: Record<Ticket['status'], {
  badge: string;
  dot: string;
  label: string;
}> = {
  OPEN: {
    badge: 'border-border text-text-secondary bg-surface-hover/50',
    dot: 'bg-slate-400',
    label: 'Open',
  },
  IN_PROGRESS: {
    badge: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    dot: 'bg-amber-500 animate-pulse',
    label: 'In Progress',
  },
  IN_REVIEW: {
    badge: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    dot: 'bg-indigo-500',
    label: 'In Review',
  },
  CLOSED: {
    badge: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    dot: 'bg-emerald-500',
    label: 'Closed',
  },
  ON_HOLD: {
    badge: 'border-border text-text-muted bg-surface-muted/50',
    dot: 'bg-text-muted',
    label: 'On Hold',
  },
};

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
  departmentName?: string;
  index?: number;
}

export const TicketCard = ({ ticket, onClick, departmentName, index = 0 }: TicketCardProps) => {
  const { user } = useAuth();
  const { totalItems, doneItems, progress } = getChecklistProgress(ticket.checklists);

  const isOverdue = ticket.isOverdue && ticket.status !== 'CLOSED';
  const priorityInfo = PRIORITY_CONFIG[ticket.priority];
  const statusInfo = STATUS_CONFIG[ticket.status];
  const statusLabel = getTicketStatusLabel(ticket.status, user?.role, statusInfo.label);
  const assigneeName = ticket.assignee ? ticket.assignee.firstName : null;

  return (
    <button
      type="button"
      onClick={() => onClick(ticket)}
      className="w-full text-left flex flex-col gap-3 p-4 rounded-2xl border border-border/60 bg-surface hover:border-primary-500/40 hover:shadow-md transition-all duration-200 group cursor-pointer animate-step-in relative overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      {/* Top Row: Department Tag + Chevron */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-display font-medium bg-primary-500/10 text-primary-600 dark:text-primary-300 truncate max-w-[160px]">
          {departmentName ?? 'Ticket'}
        </span>
        <ChevronRight
          size={15}
          className="shrink-0 text-text-muted group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200"
        />
      </div>

      {/* Priority Avatar + Title */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center size-9 rounded-full border shrink-0 transition-transform group-hover:scale-105 ${priorityInfo.iconBg}`}>
          <TicketIcon size={15} />
        </div>
        <h3 className="flex-1 min-w-0 text-sm font-display font-semibold text-text leading-snug line-clamp-1 group-hover:text-primary-500 transition-colors">
          {ticket.title}
        </h3>
      </div>

      {/* Body: Clamped Description */}
      {ticket.description && (
        <p className="text-xs font-display text-text-secondary/80 leading-snug line-clamp-2 pl-12">
          {ticket.description}
        </p>
      )}

      {/* Checklist Progress Bar */}
      {progress !== null && (
        <div className="flex items-center gap-2 pl-12">
          <CheckSquare size={12} className="text-primary-500 shrink-0" />
          <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono tabular-nums text-text-muted shrink-0">{doneItems}/{totalItems}</span>
        </div>
      )}

      {/* Footer: Status/Priority/Due Chips + Assignee Avatar */}
      <div className="flex items-center justify-between gap-2 pt-2 pl-12 border-t border-border/40">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Chip with Pulse Dot */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-display font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.badge}`}>
            <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
            {statusLabel}
          </span>

          {/* Priority Chip */}
          <span className={`text-xs font-display font-medium px-2.5 py-0.5 rounded-full border ${priorityInfo.badge}`}>
            {priorityInfo.label}
          </span>

          {/* TAT Due / Overdue Badge */}
          {ticket.tatDueAt && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-display font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
                isOverdue
                  ? 'border-rose-500/50 text-rose-500 bg-rose-500/10 animate-pulse'
                  : 'border-border/80 text-text-muted bg-surface-muted/40'
              }`}
            >
              {isOverdue ? <AlertCircle size={11} className="shrink-0" /> : <Clock size={11} className="shrink-0" />}
              <span>{new Date(ticket.tatDueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {assigneeName ? (
          <div
            className="flex items-center justify-center size-6.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-[10px] font-semibold shrink-0 shadow-xs ring-2 ring-surface"
            title={`Assigned to ${assigneeName}`}
          >
            {getInitials(assigneeName)}
          </div>
        ) : (
          <div className="flex items-center justify-center size-6.5 rounded-full border border-dashed border-border text-text-muted shrink-0" title="Unassigned">
            <User size={12} />
          </div>
        )}
      </div>
    </button>
  );
};
