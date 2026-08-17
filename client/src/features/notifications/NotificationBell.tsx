import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, BellRing } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router';
import type { Notification } from '@/api/notifications';
import { useNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from './hooks';
import { useNotificationSocket } from './useNotificationSocket';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: notifications = [] } = useNotificationsQuery();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const navigate = useNavigate();

  useNotificationSocket();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.ticketId) navigate(`/tickets?open=${n.ticketId}`);
  };

  return (
    <div className="relative font-sans rflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={containerRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
          "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          open && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className={cn("w-5 h-5 transition-transform duration-300", open && "scale-90")} />
        
        {unreadCount > 0 && (
          <span className={cn(
            "absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1",
            "rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none",
            "ring-2 ring-white dark:ring-slate-950 transform translate-x-1/2 -translate-y-1/2",
            "animate-in zoom-in duration-300"
          )}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section 
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-50",
            "w-[calc(100vw-2rem)] sm:w-80 sm:-mr-2",
            "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden",
            "origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out flex flex-col max-h-[32rem]"
          )}
        >
          <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 rflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400",
                  "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 -mx-1"
                )}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </header>

          <div className="flex-1 ">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex items-center justify-center mb-3 text-slate-400">
                  <BellRing className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check back later for new notifications.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800",
                        n.isRead 
                          ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50" 
                          : "bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10"
                      )}
                    >
                      {/* Unread Dot */}
                      <div className="flex shrink-0 w-2 pt-2 justify-center">
                        <span className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          n.isRead ? "bg-transparent scale-50" : "bg-indigo-600 dark:bg-indigo-500 scale-100"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          n.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                        )}>
                          {n.title}
                        </p>
                        <p className={cn(
                          "text-sm line-clamp-2 leading-relaxed",
                          n.isRead ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"
                        )}>
                          {n.message}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="h-6 w-full bg-gradient-to-t from-white dark:from-slate-900 to-transparent absolute bottom-0 pointer-events-none" />
          )}
        </section>
      )}
    </div>
  );
};