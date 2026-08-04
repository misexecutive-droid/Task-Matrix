import { Link } from 'react-router';
import { Ticket as TicketIcon, CheckSquare, ArrowRight, Clock, Activity } from 'lucide-react';
import { Skeleton } from '../../components';
import { TICKET_STATUS_COLORS, TASK_STATUS_COLORS, type FeedItem } from './dashboardDisplay';
import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

interface RecentActivityProps {
  feed: FeedItem[];
  isPending: boolean;
}

export const RecentActivity = ({ feed, isPending }: RecentActivityProps) => (
  <div id="recent-activity" className="relative group rounded-2xl border border-border/60 bg-surface flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
    
    {/* Decorative Background Glow */}
    <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

    {/* Header */}
    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border/40 bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl border border-border/50 bg-surface-hover flex items-center justify-center shadow-sm">
          <Activity size={18} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-text tracking-tight">Recent Activity</h2>
          <p className="text-xs font-display text-text-muted mt-0.5">Latest updates on tickets and tasks</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs font-display font-medium">
        <Link 
          to="/tickets" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all"
        >
          Tickets <ArrowRight size={14} />
        </Link>
        <Link 
          to="/tasks" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all"
        >
          Tasks <ArrowRight size={14} />
        </Link>
      </div>
    </div>

    {/* Content Area */}
    <div className="relative z-10 flex flex-col p-2">
      {isPending ? (
        // Skeleton State
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-3/4 max-w-sm rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : feed.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="p-3 rounded-full bg-surface-hover border border-border/50">
            <Clock size={20} className="text-text-muted" />
          </div>
          <p className="text-sm font-display text-text-muted font-medium">Nothing here yet — create a ticket or task to get started.</p>
        </div>
      ) : (
        // Populated Feed
        <div className="flex flex-col gap-1">
          {feed.map(item => (
            <Link
              key={`${item.kind}-${item.id}`}
              to={item.kind === 'ticket' ? '/tickets' : '/tasks'}
              className="group/item flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl hover:bg-surface-hover/60 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon Box */}
                <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 border shadow-sm transition-colors ${
                  item.kind === 'ticket' 
                    ? 'bg-primary-500/15 border-primary-500/20 text-primary-600 dark:text-primary-400 group-hover/item:bg-primary-500/20' 
                    : 'bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover/item:bg-amber-500/20'
                }`}>
                  {item.kind === 'ticket' ? <TicketIcon size={14} /> : <CheckSquare size={14} />}
                </div>
                
                {/* Title */}
                <p className="text-sm font-display font-medium text-text truncate">
                  {item.title}
                </p>
              </div>

              {/* Badges and Metadata */}
              <div className="flex items-center gap-4 pl-11 sm:pl-0 shrink-0">
                <span className={`inline-flex items-center justify-center text-[11px] font-display font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                  item.kind === 'ticket' 
                    ? TICKET_STATUS_COLORS[item.status as TicketStatus] 
                    : TASK_STATUS_COLORS[item.status as Task['status']]
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
                
                <span className="text-xs text-text-muted font-display font-medium min-w-[50px] text-right">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
);