import { 
  Clock, 
  ChevronRight, 
  Ticket as TicketIcon, 
  User, 
  CheckSquare, 
  AlertCircle 
} from 'lucide-react';
import type { Ticket } from '../../api/ticket';

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
  const totalItems = ticket.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = ticket.checklists.reduce((s, c) => s + c.items.filter(i => i.isDone).length, 0);
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : null;

  const isOverdue = ticket.isOverdue && ticket.status !== 'CLOSED';
  const priorityInfo = PRIORITY_CONFIG[ticket.priority];
  const statusInfo = STATUS_CONFIG[ticket.status];

  return (
    <button
      type="button"
      onClick={() => onClick(ticket)}
      className="w-full text-left flex flex-col gap-3.5 p-4 rounded-xl border border-border/70 bg-surface/80 hover:bg-surface hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer animate-step-in font-mono backdrop-blur-sm relative overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      {/* Top Bar: Department Tag & Action Indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-muted border border-border/50">
          <span className="flex items-center justify-center size-3.5 rounded bg-primary-600/90 text-white shrink-0">
            <TicketIcon size={9} />
          </span>
          <span className="text-[11px] font-mono text-text-muted font-medium truncate max-w-[180px]">
            {departmentName ?? 'Ticket'}
          </span>
        </div>

        {/* Hover Arrow Effect */}
        <div className="flex items-center gap-1 text-text-muted group-hover:text-primary-500 transition-colors">
          <ChevronRight
            size={15}
            className="group-hover:translate-x-0.5 transition-transform duration-200"
          />
        </div>
      </div>

      {/* Main Header: Priority Icon Square + Title & Assignee */}
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center size-10 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${priorityInfo.iconBg}`}>
          <TicketIcon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-mono font-semibold text-text leading-snug line-clamp-1 group-hover:text-primary-500 transition-colors">
            {ticket.title}
          </h3>
          
          {/* Assignee Avatar Pill */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono">
              <User size={12} className="shrink-0 text-text-muted/70" />
              <span className="truncate">
                {ticket.assignee ? `${ticket.assignee.firstName}` : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Clamped Description */}
      {ticket.description && (
        <p className="text-xs font-mono text-text-secondary/90 leading-relaxed line-clamp-2 bg-surface-muted/30 p-2 rounded-lg border border-border/30">
          {ticket.description}
        </p>
      )}

      {/* Checklist Progress Bar */}
      {progress !== null && (
        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span className="flex items-center gap-1">
              <CheckSquare size={11} className="text-primary-500" />
              Subtasks
            </span>
            <span className="font-semibold text-text-secondary">{doneItems}/{totalItems} ({progress}%)</span>
          </div>
          <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden p-0.5 border border-border/40">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Chips Row */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
        {/* Status Chip with Pulse Dot */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.badge}`}>
          <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
          {statusInfo.label}
        </span>

        {/* Priority Chip */}
        <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${priorityInfo.badge}`}>
          {priorityInfo.label}
        </span>

        {/* TAT Due / Overdue Badge */}
        {ticket.tatDueAt && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
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
    </button>
  );
};