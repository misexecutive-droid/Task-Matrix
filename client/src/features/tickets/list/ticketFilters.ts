import type { Ticket, TicketStatus } from '../../../api/ticket';

export type FilterStatus = TicketStatus | 'ALL' | 'OVERDUE';

export const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'All Tickets' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'OVERDUE', label: 'Overdue' },
];

// Lookup map instead of an if/else or ternary chain — each filter key maps straight to its
// own predicate, so adding a new filter later is just one more entry, no branching to extend.
export const STATUS_FILTER_PREDICATES: Record<FilterStatus, (t: Ticket) => boolean> = {
  ALL: () => true,
  OVERDUE: t => t.isOverdue && t.status !== 'CLOSED',
  OPEN: t => t.status === 'OPEN',
  IN_PROGRESS: t => t.status === 'IN_PROGRESS',
  IN_REVIEW: t => t.status === 'IN_REVIEW',
  CLOSED: t => t.status === 'CLOSED',
  ON_HOLD: t => t.status === 'ON_HOLD',
};

export type ScopeFilter = 'ALL' | 'CREATED_BY_ME' | 'ASSIGNED_TO_ME';

export const SCOPE_FILTERS: { key: ScopeFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'CREATED_BY_ME', label: 'Created by me' },
  { key: 'ASSIGNED_TO_ME', label: 'Assigned to me' },
];

export const SCOPE_FILTER_PREDICATES: Record<ScopeFilter, (t: Ticket, userId: string) => boolean> = {
  ALL: () => true,
  CREATED_BY_ME: (t, userId) => t.userId === userId,
  ASSIGNED_TO_ME: (t, userId) => t.assigneeId === userId,
};
