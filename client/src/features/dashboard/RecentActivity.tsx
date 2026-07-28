import { Link } from 'react-router';
import { Ticket as TicketIcon, CheckSquare, ArrowRight, Clock } from 'lucide-react';
import { Skeleton } from '../../components';
import { TICKET_STATUS_COLORS, TASK_STATUS_COLORS, type FeedItem } from './dashboardDisplay';
import type { TicketStatus } from '../../api/ticket';
import type { Task } from '../../api/task';

interface RecentActivityProps {
  feed: FeedItem[];
  isPending: boolean;
}

export const RecentActivity = ({ feed, isPending }: RecentActivityProps) => (
  <div id="recent-activity" className="rounded-lg border border-border bg-surface">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <h2 className="text-sm font-display font-semibold text-text">Recent activity</h2>
      <div className="flex gap-3 text-xs font-display">
        <Link to="/tickets" className="flex items-center gap-1 text-text-muted hover:text-primary-500 transition-colors">
          Tickets <ArrowRight size={12} />
        </Link>
        <Link to="/tasks" className="flex items-center gap-1 text-text-muted hover:text-primary-500 transition-colors">
          Tasks <ArrowRight size={12} />
        </Link>
      </div>
    </div>

    {isPending ? (
      <div className="flex flex-col">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
            <Skeleton className="size-7 rounded-md shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-56" />
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    ) : feed.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-14 text-text-muted gap-2">
        <Clock size={24} className="text-text-light" />
        <p className="text-sm font-display">Nothing here yet — create a ticket or task to get started.</p>
      </div>
    ) : (
      <div className="flex flex-col">
        {feed.map(item => (
          <Link
            key={`${item.kind}-${item.id}`}
            to={item.kind === 'ticket' ? '/tickets' : '/tasks'}
            className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors"
          >
            <div className={`flex items-center justify-center size-7 rounded-md shrink-0 ${
              item.kind === 'ticket' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {item.kind === 'ticket' ? <TicketIcon size={13} /> : <CheckSquare size={13} />}
            </div>
            <p className="flex-1 min-w-0 text-sm font-display text-text truncate">{item.title}</p>
            <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0 ${
              item.kind === 'ticket' ? TICKET_STATUS_COLORS[item.status as TicketStatus] : TASK_STATUS_COLORS[item.status as Task['status']]
            }`}>
              {item.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-light font-display shrink-0">
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </Link>
        ))}
      </div>
    )}
  </div>
);
