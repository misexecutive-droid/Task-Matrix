import { useState } from 'react';
import { ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { Button } from '../../components';
import { useVerifyTaskMutation } from './hook';
import type { Task } from '../../api/task';

// Shared by TaskBoard's card footer and TaskDetail's sheet footer — PC/Admin-only approve/reject
// controls shown once a task is pending_verification. Reject requires a short note (enforced
// server-side), so it expands into a small textarea instead of firing immediately.
export const TaskVerifyActions = ({ task }: { task: Task }) => {
  const verifyMut = useVerifyTaskMutation();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
        <textarea
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What needs to be fixed?"
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs font-mono bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            className="bg-rose-600 hover:bg-rose-700 font-mono text-xs h-7 px-2.5"
            disabled={verifyMut.isPending || !note.trim()}
            onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'REJECT', note: note.trim() } })}
          >
            {verifyMut.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Send back'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-xs h-7 px-2.5"
            disabled={verifyMut.isPending}
            onClick={() => { setRejecting(false); setNote(''); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      <Button
        size="sm"
        variant="primary"
        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-mono text-xs h-7 px-2.5"
        disabled={verifyMut.isPending}
        onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'APPROVE' } })}
      >
        {verifyMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
        Verify
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-mono text-xs h-7 px-2.5"
        disabled={verifyMut.isPending}
        onClick={() => setRejecting(true)}
      >
        <ShieldX size={12} />
        Reject
      </Button>
    </div>
  );
};
