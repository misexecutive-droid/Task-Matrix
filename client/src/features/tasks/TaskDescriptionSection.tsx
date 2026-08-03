import { FileText } from 'lucide-react';

/** Description card, or a dashed placeholder when the task has none. */
export const TaskDescriptionSection = ({ description }: { description: string | null | undefined }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 select-none">
        <FileText size={13} className="text-text-secondary" /> Description
      </h3>
      {description ? (
        <div className="p-4 bg-surface-hover/40 rounded-xl border border-border/50 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap shadow-2xs">
          {description}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-border/50 text-xs text-text-muted italic text-center">
          No description provided for this task.
        </div>
      )}
    </div>
  );
};
