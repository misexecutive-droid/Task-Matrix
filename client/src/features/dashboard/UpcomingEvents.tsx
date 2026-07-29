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
  <div id="upcoming-events" className="rounded-lg border border-border bg-surface">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <h2 className="text-sm font-display font-semibold text-text">Upcoming events</h2>
      <Link to="/events" className="flex items-center gap-1 text-xs font-display text-text-muted hover:text-primary-500 transition-colors">
        View all <ArrowRight size={12} />
      </Link>
    </div>

    {isPending ? (
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
            <Skeleton className="size-7 rounded-md shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-56" />
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    ) : events.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-14 text-text-muted gap-2">
        <CalendarClock size={24} className="text-text-light" />
        <p className="text-sm font-display">No upcoming deadlines, announcements, or broadcasts.</p>
      </div>
    ) : (
      <div className="flex flex-col">
        {events.map(e => {
          const Icon = EVENT_TYPE_ICONS[e.type];
          return (
            <Link
              key={e.id}
              to="/events"
              className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors"
            >
              <div className={`flex items-center justify-center size-7 rounded-md shrink-0 ${EVENT_TYPE_COLORS[e.type]}`}>
                <Icon size={13} />
              </div>
              <p className="flex-1 min-w-0 text-sm font-display text-text truncate">{e.title}</p>
              <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0 ${EVENT_TYPE_COLORS[e.type]}`}>
                {EVENT_TYPE_LABELS[e.type]}
              </span>
              <span className="text-xs text-text-light font-display shrink-0">
                {new Date(e.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          );
        })}
      </div>
    )}
  </div>
);
