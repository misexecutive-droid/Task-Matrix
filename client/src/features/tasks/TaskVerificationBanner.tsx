import { ShieldCheck, ShieldX } from 'lucide-react';
import type { Task } from '../../api/task';

/** Shows the PC's note from the last approve/reject; renders nothing if there isn't one. */
export const TaskVerificationBanner = ({ task }: { task: Task }) => {
  if (!task.verificationNote) return null;

  const wasApproved = task.status === 'done';

  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
      wasApproved
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
    }`}>
      {wasApproved ? <ShieldCheck size={14} className="shrink-0 mt-0.5" /> : <ShieldX size={14} className="shrink-0 mt-0.5" />}
      <div>
        <p className="font-semibold">
          {wasApproved && task.verifiedBy ? 'Verified' : 'Sent back for changes'}
        </p>
        <p className="mt-0.5 text-text-secondary">{task.verificationNote}</p>
      </div>
    </div>
  );
};
