import { MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../../../components';
import { SECTION_HEADER } from './detailConstants';
import type { TicketComment } from '../../../api/ticket';

interface TicketCommentsProps {
  comments: TicketComment[];
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitErrorMessage: string | null;
}

// One shared thread, visible to anyone who can already view this ticket.
export const TicketComments = ({
  comments,
  commentText,
  onCommentTextChange,
  onSubmit,
  isSubmitting,
  submitErrorMessage,
}: TicketCommentsProps) => (
  <div className="flex flex-col gap-3">
    <h3 className={SECTION_HEADER}>
      <MessageSquare size={13} /> Comments
      <span className="text-text-muted normal-case font-normal">({comments.length})</span>
    </h3>

    <div className="flex flex-col gap-3">
      {comments.length === 0 && (
        <p className="text-xs text-text-muted font-display">No comments yet.</p>
      )}
      {comments.map(c => (
        <div key={c.id} className="flex flex-col gap-1 p-3 rounded-lg border border-border/60 bg-surface">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 rounded-full bg-primary-600 text-white text-[10px] font-display font-semibold shrink-0">
              {(c.author?.firstName ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-display font-semibold text-text">
              {c.author?.firstName ?? 'Unknown'}
            </span>
            <span className="text-[10px] text-text-muted font-display">
              {new Date(c.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-text-secondary font-display whitespace-pre-wrap">{c.body}</p>
        </div>
      ))}
    </div>

    <div className="flex flex-col gap-2">
      <textarea
        value={commentText}
        onChange={e => onCommentTextChange(e.target.value)}
        placeholder="Write a comment…"
        rows={2}
        className="w-full px-3 py-2 text-xs font-display bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50"
      />
      {submitErrorMessage && (
        <p className="text-xs text-danger">{submitErrorMessage}</p>
      )}
      <Button
        size="sm"
        variant="outline"
        className="self-end font-display text-xs gap-1.5"
        disabled={!commentText.trim() || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting && <Loader2 size={12} className="animate-spin" />}
        Post comment
      </Button>
    </div>
  </div>
);
