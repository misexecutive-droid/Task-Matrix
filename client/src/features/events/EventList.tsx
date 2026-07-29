import { useState, lazy, Suspense } from 'react';
import { Plus, Trash2, Pencil, CalendarClock, Loader2 } from 'lucide-react';
import { Button, Skeleton } from '../../components';
import { useAuth } from '@/context/AuthContext';
import { useEventsQuery, useDeleteEventMutation } from './hook';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EVENT_TYPE_ICONS } from './eventDisplay';
import { ErrorMessage, EmptyState } from '../admin/adminDisplay';
import type { Event } from '@/api/events';

const EventForm = lazy(() =>
  import('./EventForm').then(module => ({ default: module.EventForm }))
);

export const EventList = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'PC';

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: events = [], isPending, isError } = useEventsQuery();
  const deleteMut = useDeleteEventMutation();

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const renderContent = () => {
    if (isPending) return <EventListSkeleton />;
    if (isError) return <ErrorMessage message="Failed to load events." />;
    if (events.length === 0) {
      return <EmptyState label="No events yet — deadlines, announcements, and broadcasts will show up here." Icon={CalendarClock} />;
    }

    return (
      <div className="flex flex-col gap-2">
        {events.map(e => {
          const Icon = EVENT_TYPE_ICONS[e.type];
          const isDeleting = deleteMut.isPending && deleteMut.variables === e.id;

          return (
            <div
              key={e.id}
              className={`flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-border-hover transition-all ${
                isDeleting ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${EVENT_TYPE_COLORS[e.type]}`}>
                <Icon size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-display font-semibold text-text truncate">{e.title}</p>
                  <span className={`text-[11px] font-display font-medium px-2 py-0.5 rounded-full shrink-0 ${EVENT_TYPE_COLORS[e.type]}`}>
                    {EVENT_TYPE_LABELS[e.type]}
                  </span>
                </div>
                {e.description && (
                  <p className="text-xs text-text-muted font-display mt-0.5 truncate">{e.description}</p>
                )}
              </div>

              <span className="text-xs text-text-light font-display shrink-0">
                {new Date(e.eventDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>

              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingEvent(e)}
                    className="p-1.5 text-text-light hover:text-primary-500 hover:bg-primary-500/10 rounded-md transition-colors cursor-pointer"
                    aria-label="Edit event"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(e.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Delete event"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin text-danger" /> : <Trash2 size={14} />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const activeModal = showForm || editingEvent;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <CalendarClock size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-text">Events</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Deadlines, announcements, and broadcasts for everyone
            </p>
          </div>
        </div>
        {canManage && (
          <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            New event
          </Button>
        )}
      </div>

      {renderContent()}

      {activeModal && (
        <Suspense fallback={null}>
          <EventForm onClose={closeForm} event={editingEvent ?? undefined} />
        </Suspense>
      )}
    </div>
  );
};

const EventListSkeleton = () => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
        <Skeleton className="size-10 rounded-lg shrink-0" />
        <Skeleton className="h-4 flex-1 max-w-56" />
        <Skeleton className="h-5 w-20 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);
