import type { TicketStatus } from '../api/ticket';

// A plain USER doesn't participate in the PC verification workflow — showing them the internal
// "In Review" state exposes a process step they can't act on and don't need to see. They get a
// generic "Under Review" label instead; every other role sees the real status name.
export const getTicketStatusLabel = (status: TicketStatus, viewerRole: string | undefined, realLabel: string) =>
  status === 'IN_REVIEW' && viewerRole === 'USER' ? 'Under Review' : realLabel;
