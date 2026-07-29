import { useState } from 'react';
import { ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { Button } from '../../../components';

interface TicketVerificationActionsProps {
  isPending: boolean;
  onApprove: () => void;
  onReject: (note: string) => void;
}

// PC/Admin verification actions — only shown while the ticket is awaiting review.
export const TicketVerificationActions = ({ isPending, onApprove, onReject }: TicketVerificationActionsProps) => {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  return (
    <div className="px-4 pt-3 pb-1 border-t border-border/40 bg-surface/50 flex flex-col gap-2">
      {!showRejectBox ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-display text-xs"
            isLoading={isPending}
            onClick={onApprove}
          >
            <ShieldCheck size={13} />
            Verify & Close
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-display text-xs"
            disabled={isPending}
            onClick={() => setShowRejectBox(true)}
          >
            <ShieldX size={13} />
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="What needs to be fixed before this can be approved?"
            rows={2}
            className="w-full px-3 py-2 text-xs font-display bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 font-display text-xs"
              disabled={isPending || !rejectNote.trim()}
              onClick={() => onReject(rejectNote.trim())}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : 'Send back'}
            </Button>
            <Button size="sm" variant="outline" className="font-display text-xs" disabled={isPending} onClick={() => { setShowRejectBox(false); setRejectNote(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
