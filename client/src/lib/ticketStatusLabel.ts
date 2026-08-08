import type { TicketStatus } from '../api/ticket';

export const getTicketStatusLabel = (status: TicketStatus, viewerRole: string | undefined, realLabel: string) =>
  status === 'IN_REVIEW' && viewerRole === 'USER' ? 'Under Review' : realLabel;
