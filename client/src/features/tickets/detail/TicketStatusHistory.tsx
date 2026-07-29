import { History, Camera, User, ArrowRight, Eye } from 'lucide-react';
import { SECTION_HEADER, STATUS_UPDATE_OPTIONS, UPLOADS_BASE } from './detailConstants';
import type { TicketStatusUpdate } from '../../../api/ticket';

interface TicketStatusHistoryProps {
  statusUpdates: TicketStatusUpdate[];
  onPreview: (url: string) => void;
}

// Consistent date & time formatter
const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
};

export const TicketStatusHistory = ({ statusUpdates, onPreview }: TicketStatusHistoryProps) => {
  if (!statusUpdates || statusUpdates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className={`${SECTION_HEADER} flex items-center gap-1.5`}>
        <History size={13} className="text-text-muted" />
        <span>Status History</span>
      </h3>

      {/* Vertical Timeline Wrapper */}
      <div className="relative pl-3.5 space-y-3 before:absolute before:left-1.5 before:top-2.5 before:bottom-2.5 before:w-px before:bg-border/60">
        {statusUpdates.map((su) => {
          const statusOption = STATUS_UPDATE_OPTIONS.find((o) => o.value === su.toStatus);
          const statusLabel = statusOption?.label ?? su.toStatus;
          
          const firstName = su.changedBy?.firstName || '';
          const lastName = su.changedBy?.lastName || '';
          const userDisplayName = `${firstName} ${lastName}`.trim() || 'Unknown';

          return (
            <div key={su.id} className="relative group">
              <span className="absolute -left-3.5 top-3.5 size-2 rounded-full bg-primary-500 ring-4 ring-surface" />

              <div className="flex flex-col gap-2 p-3.5 rounded-md border border-border/80 bg-surface hover:border-border transition-all">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="font-semibold text-text flex items-center gap-1">
                      <User size={12} className="text-text-muted" />
                      {userDisplayName}
                    </span>
                    
                    <span className="text-text-muted flex items-center gap-1 text-[11px]">
                      <ArrowRight size={10} className="text-text-muted/60" />
                      <span>moved to</span>
                    </span>

                    <span className="px-1.5 py-0.5 rounded-md bg-surface-muted text-text font-medium text-[11px] border border-border/60">
                      {statusLabel}
                    </span>
                  </div>

                  <span className="text-[11px] text-text-muted font-medium ml-auto">
                    {formatDateTime(su.createdAt)}
                  </span>
                </div>

                {/* Remark / Reason */}
                {su.remark && (
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                    {su.remark}
                  </p>
                )}

                {/* Evidence Attachments */}
                {su.photos && su.photos.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary-500 uppercase tracking-wider">
                      <Camera size={11} />
                      <span>Evidence ({su.photos.length})</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {su.photos.map((photo) => {
                        const imageUrl = `${UPLOADS_BASE}${photo.url}`;
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => onPreview(imageUrl)}
                            className="group/photo relative size-14 rounded-md border border-border overflow-hidden bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer"
                            title={
                              photo.captureMethod === 'LIVE'
                                ? 'Captured live camera'
                                : 'Uploaded from gallery'
                            }
                            aria-label="Preview evidence photo"
                          >
                            <img
                              src={imageUrl}
                              alt="Evidence attachment"
                              className="size-full object-cover transition-transform duration-200 group-hover/photo:scale-105"
                            />
                            {/* Hover Overlay with Preview Icon */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};