import { useState } from 'react';
import { Calendar, Copy, Check } from 'lucide-react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Ticket } from '../../../api/ticket';

interface TicketDetailHeaderProps {
  ticket: Ticket;
}

// Robust date formatter to prevent locale inconsistencies or invalid date crashes
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const TicketDetailHeader = ({ ticket }: TicketDetailHeaderProps) => {
  const [copied, setCopied] = useState(false);

  // Safely format ticket reference code
  const ticketCode = `TICK-${ticket.id ? ticket.id.slice(0, 6).toUpperCase() : '------'}`;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard permissions are restricted
    }
  };

  return (
    <SheetHeader className="p-5 pb-4 border-b border-border/60 bg-surface/80 backdrop-blur-sm text-left">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            {/* Interactive Ticket ID Badge */}
            <button
              type="button"
              onClick={handleCopyId}
              className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-500/10 hover:bg-primary-500/15 text-primary-500 text-[11px] font-mono font-semibold border border-primary-500/20 transition-all cursor-pointer"
              title="Click to copy ticket ID"
              aria-label={`Copy ticket code ${ticketCode}`}
            >
              <span>{ticketCode}</span>
              {copied ? (
                <Check size={11} className="text-emerald-500" />
              ) : (
                <Copy size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              )}
            </button>

            {/* Created Date */}
            <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
              <Calendar size={12} className="shrink-0 opacity-70" />
              <span>Created {formatDate(ticket.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <SheetTitle className="text-base font-semibold text-text leading-snug break-words select-text">
          {ticket.title}
        </SheetTitle>
      </div>
    </SheetHeader>
  );
};