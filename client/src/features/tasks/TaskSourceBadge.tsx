import { MessageCircle, Sparkles } from 'lucide-react';
import type { Task } from '../../api/task';

interface TaskSourceBadgeProps {
  aiMeta: Task['aiMeta'];
}

// No badge at all for a plain manually-created task (no aiMeta) — the badge only exists to
// call out the *unusual* cases: this task wasn't typed into the New Task form by a person.
export const TaskSourceBadge = ({ aiMeta }: TaskSourceBadgeProps) => {
  if (!aiMeta) return null;

  if (aiMeta.channel === 'whatsapp') {
    return (
      <span
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
        title={`Created via WhatsApp${aiMeta.inputMode === 'voice' ? ' (voice note)' : ''}`}
      >
        <MessageCircle size={10} />
        WhatsApp
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0"
      title="Created via Smart Add on the web app"
    >
      <Sparkles size={10} />
      Smart Add
    </span>
  );
};
