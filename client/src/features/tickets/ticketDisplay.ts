import type { Ticket, TicketStatus } from '../../api/ticket';

// Same recipe as taskDisplay.tsx's PRIORITY_MAP/STATUS_CONFIG (bg-X/10 + text-X, no border, no
// uppercase, theme tokens only) — the single source of truth for ticket status/priority color
// everywhere a ticket badge is rendered (card, dashboard feed, detail page), so a status never
// reads a different color depending on which screen shows it.
export const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string; dot: string }> = {
  OPEN: { label: 'Open', className: 'bg-surface-hover text-text-secondary', dot: 'bg-text-light' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  IN_REVIEW: { label: 'In Review', className: 'bg-primary-500/10 text-primary-600 dark:text-primary-400', dot: 'bg-primary-500' },
  CLOSED: { label: 'Closed', className: 'bg-success/10 text-success', dot: 'bg-success' },
  ON_HOLD: { label: 'On Hold', className: 'bg-surface text-text-muted', dot: 'bg-text-light' },
};

export const PRIORITY_CONFIG: Record<Ticket['priority'], { label: string; className: string; accent: string }> = {
  LOW: { label: 'Low', className: 'bg-surface-hover text-text-muted', accent: 'bg-text-light' },
  MEDIUM: { label: 'Medium', className: 'bg-warning/10 text-warning', accent: 'bg-warning' },
  HIGH: { label: 'High', className: 'bg-danger/10 text-danger', accent: 'bg-danger' },
  CRITICAL: { label: 'Critical', className: 'bg-danger/15 text-danger font-bold', accent: 'bg-danger' },
};
