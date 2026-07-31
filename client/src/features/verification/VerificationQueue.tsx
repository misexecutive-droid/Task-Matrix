import { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Loader2,
  Ticket as TicketIcon,
  CheckSquare,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import { Button } from '../../components';
import { useTicketsByStatusQuery, useVerifyTicketMutation } from '../tickets/hook';
import { useTasksByStatusQuery, useVerifyTaskMutation } from '../tasks/hook';
import { usePendingVerificationChecklistInstancesQuery, useVerifyChecklistInstanceMutation } from '../checklist/hook';
import { formatDate } from '../checklist/checklistDisplay';
import type { Ticket } from '../../api/ticket';
import type { Task } from '../../api/task';
import type { ChecklistInstance } from '../../api/checklistInstances';

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
    <div className="group flex flex-col p-4 rounded-xl border border-border/60 bg-surface/60 hover:bg-surface/90 hover:border-border hover:shadow-sm transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Info Section */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20 shrink-0 shadow-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{title}</p>
            <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {!rejecting && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-600 transition-colors"
              disabled={isPending}
              onClick={() => setRejecting(true)}
            >
              <X size={14} />
              <span className="hidden sm:inline">Reject</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-900/20"
              disabled={isPending}
              onClick={() => onApprove()}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Rejecting Expansion State */}
      {rejecting && (
        <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Please detail what needs to be fixed before approval..."
            rows={2}
            className="w-full px-3.5 py-2.5 text-sm bg-surface/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 resize-none transition-all placeholder:text-text-muted/50"
          />
          <div className="flex items-center justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              disabled={isPending} 
              onClick={() => { setRejecting(false); setNote(''); }}
              className="text-text-muted hover:text-text"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-900/20"
              disabled={isPending || !note.trim()}
              onClick={() => onReject(note.trim())}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send Back for Revision'}
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
      icon={<TicketIcon size={18} />}
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
      icon={<CheckSquare size={18} />}
      title={task.title}
      subtitle={task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
      isPending={verifyMut.isPending}
      onApprove={(note) => verifyMut.mutate({ id: task.id, payload: { action: 'APPROVE', note } })}
      onReject={(note) => verifyMut.mutate({ id: task.id, payload: { action: 'REJECT', note } })}
    />
  );
};

const ChecklistRow = ({ instance }: { instance: ChecklistInstance }) => {
  const verifyMut = useVerifyChecklistInstanceMutation();
  return (
    <QueueRow
      icon={<Repeat size={18} />}
      title={instance.title}
      subtitle={`${formatDate(instance.periodStart)} – ${formatDate(instance.periodEnd)} · every item checked off`}
      isPending={verifyMut.isPending}
      onApprove={(note) => verifyMut.mutate({ id: instance.id, payload: { action: 'APPROVE', note } })}
      onReject={(note) => verifyMut.mutate({ id: instance.id, payload: { action: 'REJECT', note } })}
    />
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/40 bg-surface/30 animate-pulse">
    <div className="size-10 rounded-lg bg-border/50 shrink-0" />
    <div className="flex-1 space-y-2.5 py-1">
      <div className="h-4 bg-border/60 rounded w-1/3 sm:w-1/4" />
      <div className="h-3 bg-border/40 rounded w-1/2 sm:w-1/3" />
    </div>
    <div className="hidden sm:flex items-center gap-2">
      <div className="h-8 w-20 bg-border/40 rounded-md" />
      <div className="h-8 w-24 bg-border/60 rounded-md" />
    </div>
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-border/70 bg-surface/30 text-center">
    <div className="flex items-center justify-center size-10 rounded-full bg-emerald-500/10 mb-3">
      <CheckCircle2 size={20} className="text-emerald-500" />
    </div>
    <p className="text-sm font-medium text-text">All caught up</p>
    <p className="text-xs text-text-muted mt-1">No {label} waiting for verification.</p>
  </div>
);

export const VerificationQueue = () => {
  const { data: tickets = [], isPending: ticketsPending } = useTicketsByStatusQuery('IN_REVIEW');
  const { data: tasks = [], isPending: tasksPending } = useTasksByStatusQuery('pending_verification');
  const { data: checklists = [], isPending: checklistsPending } = usePendingVerificationChecklistInstancesQuery();

  const totalItems = tickets.length + tasks.length + checklists.length;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20 border border-primary-400/20">
          <ShieldCheck size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold text-text tracking-tight">Verification Queue</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {totalItems === 0 
              ? 'Your queue is completely clear' 
              : `${totalItems} item${totalItems !== 1 ? 's' : ''} waiting on your review`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Tickets Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Tickets</h2>
            {!ticketsPending && tickets.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-border/50 text-[10px] font-medium text-text-muted">
                {tickets.length}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            {ticketsPending && (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {!ticketsPending && tickets.length === 0 && <EmptyState label="tickets" />}
            {tickets.map(t => <TicketRow key={t.id} ticket={t} />)}
          </div>
        </section>

        {/* Tasks Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Tasks</h2>
            {!tasksPending && tasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-border/50 text-[10px] font-medium text-text-muted">
                {tasks.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {tasksPending && (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {!tasksPending && tasks.length === 0 && <EmptyState label="tasks" />}
            {tasks.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        </section>

        {/* Checklists Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Checklists</h2>
            {!checklistsPending && checklists.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-border/50 text-[10px] font-medium text-text-muted">
                {checklists.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {checklistsPending && (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {!checklistsPending && checklists.length === 0 && <EmptyState label="checklists" />}
            {checklists.map(c => <ChecklistRow key={c.id} instance={c} />)}
          </div>
        </section>
      </div>
    </div>
  );
};