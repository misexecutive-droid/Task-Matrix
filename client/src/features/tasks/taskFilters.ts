import { CalendarClock, Flag, Clock, ArrowDownAZ, type LucideIcon } from 'lucide-react';
import type { Task } from '../../api/task';

// "Issue" and "Delegation" are the two real category values on Task, but a plain task typed
// into the "New Task" form also lands in category "delegation" with no aiMeta at all — so from
// the user's point of view that's really a third bucket ("Direct Task") distinct from AI/WhatsApp
// delegations. These are UI-only filter keys, not stored values, split out via a lookup map
// (rather than if/else) so adding another bucket later is just one more entry here.
export type CategoryFilterKey = 'all' | 'issue' | 'delegation' | 'task';

export const CATEGORY_PREDICATES: Record<CategoryFilterKey, (t: Task) => boolean> = {
  all: () => true,
  issue: (t) => t.category === 'issue',
  delegation: (t) => t.category === 'delegation' && !!t.aiMeta,
  task: (t) => t.category === 'delegation' && !t.aiMeta,
};

export type TaskSortKey = 'dueDate' | 'priority' | 'createdAt' | 'title';

export const SORT_LABEL: Record<TaskSortKey, string> = {
  dueDate: 'Due date',
  priority: 'Priority',
  createdAt: 'Created date',
  title: 'Title',
};

export const SORT_ICON: Record<TaskSortKey, LucideIcon> = {
  dueDate: CalendarClock,
  priority: Flag,
  createdAt: Clock,
  title: ArrowDownAZ,
};

const PRIORITY_RANK: Record<Task['priority'], number> = { low: 0, medium: 1, high: 2 };

// Tasks with no due date sort after every dated task, regardless of sort direction —
// "no deadline" isn't meaningfully earlier or later than a real date.
export const SORT_COMPARATORS: Record<TaskSortKey, (a: Task, b: Task) => number> = {
  dueDate: (a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  },
  priority: (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
  createdAt: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  title: (a, b) => a.title.localeCompare(b.title),
};
