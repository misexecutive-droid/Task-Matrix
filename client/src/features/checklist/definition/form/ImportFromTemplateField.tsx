import { Sparkles } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SELECT_TRIGGER_CLASS } from './formConstants';
import type { ChecklistTemplate } from '../../../../api/checklistTemplates';

interface ImportFromTemplateFieldProps {
  templates: ChecklistTemplate[] | undefined;
  onImport: (templateId: string) => void;
}

const TARGET_LABEL: Record<ChecklistTemplate['appliesTo'], string> = {
  TASK: 'Tasks',
  TICKET: 'Tickets',
};

// Optional convenience: copies a Checklist Template's step labels into this form's item
// editor. Templates apply to a single task/ticket and have no schedule of their own, so this
// is a one-time copy, not a lasting link — the admin can still edit the imported steps freely.
export const ImportFromTemplateField = ({ templates, onImport }: ImportFromTemplateFieldProps) => {
  const usable = (templates ?? []).filter((t) => t.items.length > 0);
  if (usable.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-coral-500/25 bg-coral-500/10">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center text-coral-600 dark:text-coral-400 shrink-0">
          <Sparkles size={13} />
        </span>
        <span className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wider">
          Start From a Template
        </span>
        <span className="text-[11px] font-display normal-case font-normal text-text-muted/70 tracking-normal">
          (Optional)
        </span>
      </div>
      <Select value="" onValueChange={onImport}>
        <SelectTrigger className={SELECT_TRIGGER_CLASS}>
          <SelectValue placeholder="Copy steps from an existing Checklist Template…" />
        </SelectTrigger>
        <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
          {usable.map((t) => (
            <SelectItem key={t.id} value={t.id} className="font-display text-xs">
              {t.name} · {t.items.length} step{t.items.length !== 1 ? 's' : ''} ({TARGET_LABEL[t.appliesTo]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-text-muted">
        Copies that template's step labels in below — you can still edit, add, or remove steps afterward.
      </p>
    </div>
  );
};
