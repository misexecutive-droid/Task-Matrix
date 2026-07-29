import { CalendarClock, Megaphone, Radio } from 'lucide-react';
import type { EventType } from '../../api/events';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  DEADLINE: 'Deadline',
  ANNOUNCEMENT: 'Announcement',
  BROADCAST: 'Broadcast',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  DEADLINE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  ANNOUNCEMENT: 'bg-primary-500/10 text-primary-600 dark:text-primary-300',
  BROADCAST: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export const EVENT_TYPE_ICONS: Record<EventType, typeof CalendarClock> = {
  DEADLINE: CalendarClock,
  ANNOUNCEMENT: Megaphone,
  BROADCAST: Radio,
};
