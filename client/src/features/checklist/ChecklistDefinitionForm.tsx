import { useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCreateChecklistDefinitionMutation, useDepartmentsQuery } from './hook';
import { AssigneeMultiSelect } from './AssigneeMultiSelect';
import { ChecklistDefinitionItemDraftRow, emptyItemDraft, type ItemDraft } from './ChecklistDefinitionItemDraftRow';
import type { ChecklistRecurrence } from '../../api/checklistDefinitions';

const SELECT_CLASS = 'w-full px-3 h-9 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer hover:border-border/80';
const LABEL_CLASS = 'text-xs font-mono font-medium text-text-secondary uppercase tracking-wider';

const RECURRENCE_OPTIONS: { value: ChecklistRecurrence; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One-time' },
];

interface ChecklistDefinitionFormProps {
  onClose: () => void;
}

export const ChecklistDefinitionForm = ({ onClose }: ChecklistDefinitionFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [recurrence, setRecurrence] = useState<ChecklistRecurrence>('DAILY');
  const [startDate, setStartDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);

  const { data: departments } = useDepartmentsQuery();
  const createDefinition = useCreateChecklistDefinitionMutation();

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  // Assignable users are scoped to a department server-side, so a department change invalidates
  // any previously picked assignees.
  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setAssigneeIds([]);
  };

  const items = itemDrafts.filter(d => d.label.trim()).map(d => ({ label: d.label.trim() }));
  const canSubmit = !!name.trim() && !!departmentId && !!startDate && assigneeIds.length > 0 && items.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createDefinition.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        departmentId,
        recurrence,
        startDate: new Date(startDate).toISOString(),
        assigneeIds,
        items,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg border-border/60 bg-surface/95 backdrop-blur-md shadow-2xl p-5 rounded-xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden font-mono">
        <DialogHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-mono font-semibold tracking-tight text-text">
                New Recurring Checklist
              </DialogTitle>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Define a checklist that regenerates on a schedule for specific team members.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-1">
          <Input
            id="checklist-name"
            label="Checklist Name"
            placeholder="e.g. Store Opening Checklist"
            className="font-mono text-sm h-9"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="checklist-description" className={LABEL_CLASS}>
              Description <span className="normal-case font-normal text-text-muted/70 tracking-normal">(Optional)</span>
            </label>
            <textarea
              id="checklist-description"
              rows={2}
              placeholder="What is this checklist for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-text-muted/60 resize-none transition-all hover:border-border/80"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>Department</label>
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map(d => (
                    <SelectItem key={d.id} value={d.id} className="font-mono text-xs">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>Recurrence</label>
              <Select value={recurrence} onValueChange={v => setRecurrence(v as ChecklistRecurrence)}>
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="font-mono text-xs">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="checklist-start-date" className={LABEL_CLASS}>
              {recurrence === 'ONE_TIME' ? 'Due Date' : 'Starts On'}
            </label>
            <input
              id="checklist-start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={SELECT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={LABEL_CLASS}>Assigned Users</label>
            <AssigneeMultiSelect departmentId={departmentId || undefined} selected={assigneeIds} onChange={setAssigneeIds} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={LABEL_CLASS}>Items ({itemDrafts.length})</label>
            {itemDrafts.map((draft, i) => (
              <ChecklistDefinitionItemDraftRow key={i} index={i} draft={draft} onChange={updateDraft} />
            ))}
            <button
              type="button"
              onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
              className="flex items-center justify-center gap-2 py-2 text-sm font-mono font-medium text-primary-600 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 rounded-lg border-dashed transition-colors w-full"
            >
              <Plus size={16} />
              Add Another Item
            </button>
          </div>

          {createDefinition.isError && (
            <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono">
              {createDefinition.error instanceof Error ? createDefinition.error.message : 'Failed to create checklist.'}
            </div>
          )}
        </div>

        <DialogFooter className="mt-3 pt-2 border-t border-border/40 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={createDefinition.isPending} className="font-mono">
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit} isLoading={createDefinition.isPending} className="font-mono">
            Create Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
