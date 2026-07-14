import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './hooks';
import type { Notification } from '../../api/notifications';
import { ICON_BUTTON_CLASS } from '../../components/layout/Header';

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
        className={`relative ${ICON_BUTTON_CLASS}`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-display font-semibold flex items-center justify-center ring-2 ring-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-h-96 overflow-y-auto bg-surface rounded-lg border border-border shadow-xl origin-top-right animate-dropdown-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface">
              <span className="text-sm font-display font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs font-display text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer transition-colors"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 && (
              <p className="px-4 py-6 text-xs text-text-muted font-display text-center">No notifications yet.</p>
            )}

            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors cursor-pointer ${!n.isRead ? 'bg-primary-500/5' : ''}`}
              >
                <p className="text-sm font-display font-medium text-text">{n.title}</p>
                <p className="text-xs text-text-secondary font-display mt-0.5">{n.message}</p>
                <p className="text-[10px] text-text-muted font-display mt-1">
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