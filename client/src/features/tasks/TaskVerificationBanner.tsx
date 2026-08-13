import { ShieldCheck, ShieldX } from 'lucide-react';
import type { Task } from '../../api/task';

export const TaskVerificationBanner = ({ task }: { task: Task }) => {
  if (!task.verificationNote) return null;

  const wasApproved = task.status === 'done';

  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
      wasApproved
        ? 'bg-success/10 border-success/20 text-success'
        : 'bg-warning/10 border-warning/20 text-warning'
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
