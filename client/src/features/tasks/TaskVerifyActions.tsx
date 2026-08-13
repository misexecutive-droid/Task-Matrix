import { useState } from 'react';
import { ShieldCheck, ShieldX, Loader2, X, Send } from 'lucide-react';
import { Button } from '../../components';
import { useVerifyTaskMutation } from './hook';
import type { Task } from '../../api/task';

interface TaskVerifyActionsProps {
  task: Task;
  /** Icon-only, no labels — for tight spots like TaskCard's board footer, where full-text
   *  buttons crowd out the assignee info next to them. TaskDetail's sheet footer has plenty
   *  of room, so it keeps the labeled default. */
  compact?: boolean;
}

const iconButtonClass = (tone: 'success' | 'danger') =>
  `flex items-center justify-center size-7 rounded-full transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 shrink-0 ${
    tone === 'success'
      ? 'bg-success/10 text-success hover:bg-success hover:text-white focus-visible:ring-success/40'
      : 'bg-danger/10 text-danger hover:bg-danger hover:text-white focus-visible:ring-danger/40'
  }`;

// Shared by TaskBoard's card footer and TaskDetail's sheet footer — PC/Admin-only approve/reject
// controls shown once a task is pending_verification. Reject requires a short note (enforced
// server-side), so it expands into a small textarea instead of firing immediately.
export const TaskVerifyActions = ({ task, compact = false }: TaskVerifyActionsProps) => {
  const verifyMut = useVerifyTaskMutation();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  if (rejecting) {
    return (
      <div
        className="flex flex-col gap-2.5 p-3 bg-danger/10 border border-danger/20 rounded-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <textarea
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason for rejection..."
          rows={2}
          className="w-full px-3 py-2 text-sm text-text bg-surface border border-danger/30 rounded-md placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger transition-all resize-none shadow-sm"
        />
        <div className="flex items-center gap-2 justify-end">
          {compact ? (
            <>
              <button
                type="button"
                aria-label="Cancel"
                title="Cancel"
                disabled={verifyMut.isPending}
                onClick={() => { setRejecting(false); setNote(''); }}
                className="flex items-center justify-center size-7 rounded-full text-text-muted hover:bg-surface-hover transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-border-hover shrink-0"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Send back"
                title="Send back"
                disabled={verifyMut.isPending || !note.trim()}
                onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'REJECT', note: note.trim() } })}
                className={iconButtonClass('danger')}
              >
                {verifyMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.5} />}
              </button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-3 font-medium border-border text-text-secondary hover:bg-surface-hover bg-surface"
                disabled={verifyMut.isPending}
                onClick={() => { setRejecting(false); setNote(''); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="text-xs h-7 px-3 font-medium bg-danger hover:bg-danger/90 text-white shadow-sm"
                disabled={verifyMut.isPending || !note.trim()}
                onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'REJECT', note: note.trim() } })}
              >
                {verifyMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send back'}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Verify task"
          title="Verify task"
          disabled={verifyMut.isPending}
          onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'APPROVE' } })}
          className={iconButtonClass('success')}
        >
          {verifyMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={2.5} />}
        </button>
        <button
          type="button"
          aria-label="Reject"
          title="Reject"
          disabled={verifyMut.isPending}
          onClick={() => setRejecting(true)}
          className={iconButtonClass('danger')}
        >
          <ShieldX size={13} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      <Button
        size="sm"
        variant="primary"
        className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-white font-medium text-xs h-8 px-3 shadow-sm border-0"
        disabled={verifyMut.isPending}
        onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'APPROVE' } })}
      >
        {verifyMut.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ShieldCheck size={14} strokeWidth={2.5} />
        )}
        Verify Task
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 gap-1.5 border-border bg-surface text-danger hover:bg-danger/10 hover:border-danger/30 font-medium text-xs h-8 px-3 shadow-sm transition-all"
        disabled={verifyMut.isPending}
        onClick={() => setRejecting(true)}
      >
        <ShieldX size={14} strokeWidth={2.5} />
        Reject
      </Button>
    </div>
  );
};