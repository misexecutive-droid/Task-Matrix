import { useState } from 'react';
import { ShieldCheck, Check, X, Loader2, Ticket as TicketIcon, CheckSquare } from 'lucide-react';
import { Button } from '../../components';
import { useTicketsByStatusQuery, useVerifyTicketMutation } from '../tickets/hook';
import { useTasksByStatusQuery, useVerifyTaskMutation } from '../tasks/hook';
import type { Ticket } from '../../api/ticket';
import type { Task } from '../../api/task';

// One row shared by both the ticket and task lists below — approve is one click, reject opens
// an inline textarea since a note is required server-side when rejecting.
interface QueueRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onApprove: (note?: string) => void;
  onReject: (note: string) => void;
  isPending: boolean;
}

const QueueRow = ({ icon, title, subtitle, onApprove, onReject, isPending }: QueueRowProps) => {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-border/70 bg-surface/80">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold text-text truncate">{title}</p>
          <p className="text-xs font-mono text-text-muted truncate">{subtitle}</p>
        </div>
      </div>

      {!rejecting ? (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="primary"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            disabled={isPending}
            onClick={() => onApprove()}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
            disabled={isPending}
            onClick={() => setRejecting(true)}
          >
            <X size={13} />
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What needs to be fixed before this can be approved?"
            rows={2}
            className="w-full px-3 py-2 text-xs font-mono bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={isPending || !note.trim()}
              onClick={() => onReject(note.trim())}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : 'Send back'}
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => { setRejecting(false); setNote(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const TicketRow = ({ ticket }: { ticket: Ticket }) => {
  const verifyMut = useVerifyTicketMutation();
  return (
    <QueueRow
      icon={<TicketIcon size={16} />}
      title={ticket.title}
      subtitle={ticket.assignee ? `Handled by ${ticket.assignee.firstName}` : 'Unassigned'}
      isPending={verifyMut.isPending}
      onApprove={(note) => verifyMut.mutate({ id: ticket.id, payload: { action: 'APPROVE', note } })}
      onReject={(note) => verifyMut.mutate({ id: ticket.id, payload: { action: 'REJECT', note } })}
    />
  );
};

const TaskRow = ({ task }: { task: Task }) => {
  const verifyMut = useVerifyTaskMutation();
  return (
    <QueueRow
      icon={<CheckSquare size={16} />}
      title={task.title}
      subtitle={task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
      isPending={verifyMut.isPending}
      onApprove={(note) => verifyMut.mutate({ id: task.id, payload: { action: 'APPROVE', note } })}
      onReject={(note) => verifyMut.mutate({ id: task.id, payload: { action: 'REJECT', note } })}
    />
  );
};

export const VerificationQueue = () => {
  const { data: tickets = [], isPending: ticketsPending } = useTicketsByStatusQuery('IN_REVIEW');
  const { data: tasks = [], isPending: tasksPending } = useTasksByStatusQuery('pending_verification');

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold text-text">Verification queue</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {tickets.length + tasks.length} item{tickets.length + tasks.length !== 1 ? 's' : ''} waiting on your review
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-display font-semibold text-text-muted uppercase tracking-wider">Tickets</h2>
        {ticketsPending && <p className="text-sm text-text-muted font-mono">Loading…</p>}
        {!ticketsPending && tickets.length === 0 && (
          <p className="text-sm text-text-muted font-mono">Nothing waiting here.</p>
        )}
        {tickets.map(t => <TicketRow key={t.id} ticket={t} />)}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-display font-semibold text-text-muted uppercase tracking-wider">Tasks</h2>
        {tasksPending && <p className="text-sm text-text-muted font-mono">Loading…</p>}
        {!tasksPending && tasks.length === 0 && (
          <p className="text-sm text-text-muted font-mono">Nothing waiting here.</p>
        )}
        {tasks.map(t => <TaskRow key={t.id} task={t} />)}
      </section>
    </div>
  );
};
