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
      <div 
        className="flex flex-col gap-2.5 p-3 bg-red-50/50 border border-red-100 rounded-lg animate-in fade-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <textarea
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason for rejection..."
          rows={2}
          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-red-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none shadow-sm"
        />
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-3 font-medium border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
            disabled={verifyMut.isPending}
            onClick={() => { setRejecting(false); setNote(''); }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="text-xs h-7 px-3 font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm"
            disabled={verifyMut.isPending || !note.trim()}
            onClick={() => verifyMut.mutate({ id: task.id, payload: { action: 'REJECT', note: note.trim() } })}
          >
            {verifyMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send back'}
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
        className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3 shadow-sm border-0"
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
        className="flex-1 gap-1.5 border-gray-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 font-medium text-xs h-8 px-3 shadow-sm transition-all"
        disabled={verifyMut.isPending}
        onClick={() => setRejecting(true)}
      >
        <ShieldX size={14} strokeWidth={2.5} />
        Reject
      </Button>
    </div>
  );
};