import { Sparkles } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LABEL_CLASS, SELECT_TRIGGER_CLASS } from './formConstants';
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
    <div className="space-y-2">
      <label className={LABEL_CLASS}>
        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Start From a Template
        <span className="normal-case font-normal text-text-muted/70 tracking-normal ml-1">(Optional)</span>
      </label>
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
