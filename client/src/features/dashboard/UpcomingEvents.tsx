import { Link } from 'react-router';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { Skeleton } from '../../components';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../events/eventDisplay';
import type { Event } from '../../api/events';

interface UpcomingEventsProps {
  events: Event[];
  isPending: boolean;
}

export const UpcomingEvents = ({ events, isPending }: UpcomingEventsProps) => (
  <div id="upcoming-events" className="relative group rounded-2xl border border-border/60 bg-surface flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
    
    {/* Decorative Background Glow */}
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

    {/* Header */}
    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border/40 bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl border border-border/50 bg-surface-hover flex items-center justify-center shadow-sm">
          <CalendarClock size={18} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-text tracking-tight">Upcoming Events</h2>
          <p className="text-xs font-display text-text-muted mt-0.5">Deadlines, announcements, and broadcasts</p>
        </div>
      </div>
      
      <Link 
        to="/events" 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-medium text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all shrink-0"
      >
        View all <ArrowRight size={14} />
      </Link>
    </div>

    {/* Content Area */}
    <div className="relative z-10 flex flex-col p-2">
      {isPending ? (
        // Skeleton State
        <div className="flex flex-col gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-3/4 max-w-sm rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="p-3 rounded-full bg-surface-hover border border-border/50">
            <CalendarClock size={20} className="text-text-muted" />
          </div>
          <p className="text-sm font-display text-text-muted font-medium">No upcoming deadlines, announcements, or broadcasts.</p>
        </div>
      ) : (
        // Populated Feed
        <div className="flex flex-col gap-1">
          {events.map(e => {
            const Icon = EVENT_TYPE_ICONS[e.type];
            return (
              <Link
                key={e.id}
                to="/events"
                className="group/item flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl hover:bg-surface-hover/60 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icon Box */}
                  <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 border border-current/10 shadow-sm transition-colors ${EVENT_TYPE_COLORS[e.type]}`}>
                    <Icon size={14} />
                  </div>
                  
                  {/* Title */}
                  <p className="text-sm font-display font-medium text-text truncate">
                    {e.title}
                  </p>
                </div>

                {/* Badges and Metadata */}
                <div className="flex items-center gap-4 pl-11 sm:pl-0 shrink-0">
                  <span className={`inline-flex items-center justify-center text-[11px] font-display font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-current/10 shadow-sm ${EVENT_TYPE_COLORS[e.type]}`}>
                    {EVENT_TYPE_LABELS[e.type]}
                  </span>
                  
                  <span className="text-xs text-text-muted font-display font-medium min-w-[50px] text-right">
                    {new Date(e.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  </div>
);