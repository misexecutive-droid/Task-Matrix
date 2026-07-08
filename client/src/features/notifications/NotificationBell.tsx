import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './hooks';
import type { Notification } from '../../api/notifications';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotificationsQuery();
  const markRead    = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const navigate     = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.ticketId) navigate(`/tickets?open=${n.ticketId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative size-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-display font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-h-96 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-display font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-display text-primary-600 hover:text-primary-700 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 && (
              <p className="px-4 py-6 text-xs text-slate-400 font-display text-center">No notifications yet.</p>
            )}

            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary-50/40' : ''}`}
              >
                <p className="text-sm font-display font-medium text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 font-display mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-400 font-display mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
