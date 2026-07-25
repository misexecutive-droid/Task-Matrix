import { useState } from 'react';
import { 
  Plus, 
  ListChecks, 
  Building2, 
  Repeat, 
  Calendar, 
  Users, 
  CheckSquare, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '../../components';
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

// ── Shared UI Classes ───────────────────────────────────────────
const LABEL_CLASS =
  'text-xs font-display font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 select-none';

const INPUT_BASE_CLASS =
  'w-full px-3 sm:px-3.5 py-2.5 text-sm font-display bg-surface/60 text-text rounded-lg border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/60 transition-all duration-200 placeholder:text-text-muted/50 hover:border-border';

const SELECT_TRIGGER_CLASS =
  'w-full h-10 px-3 sm:px-3.5 text-sm font-display bg-surface/60 text-text rounded-lg border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/60 transition-all cursor-pointer hover:border-border';

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
    setItemDrafts((drafts) => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setAssigneeIds([]);
  };

  const items = itemDrafts.filter((d) => d.label.trim()).map((d) => ({ label: d.label.trim() }));
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
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-xl border-border/50 bg-surface/90 backdrop-blur-xl shadow-2xl p-0 rounded-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all">
        
        {/* Ambient Top Glow Banner */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 opacity-90 z-10" />

        {/* Pinned Header */}
        <DialogHeader className="shrink-0 px-4 pt-5 sm:px-7 sm:pt-7 pb-4 border-b border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/25 shadow-inner shrink-0">
                <ListChecks className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight text-text flex items-center gap-2 truncate">
                  New Recurring Checklist
                </DialogTitle>
                <p className="text-xs text-text-muted font-display mt-0.5 truncate sm:whitespace-normal">
                  Define a checklist that regenerates on a schedule for specific team members.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <div className="flex flex-col gap-5 sm:gap-6 px-4 py-4 sm:px-7 sm:py-6 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-border/40 hover:scrollbar-thumb-border/80">
          
          {/* Checklist Name */}
          <div className="space-y-2">
            <label htmlFor="checklist-name" className={LABEL_CLASS}>
              <CheckSquare className="w-3.5 h-3.5 text-primary-400" /> Checklist Name
            </label>
            <input
              id="checklist-name"
              placeholder="e.g. Store Opening Checklist"
              className={`${INPUT_BASE_CLASS} h-10`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="checklist-description" className={LABEL_CLASS}>
              <FileText className="w-3.5 h-3.5 text-text-muted" /> Description 
              <span className="normal-case font-normal text-text-muted/70 tracking-normal ml-1">(Optional)</span>
            </label>
            <textarea
              id="checklist-description"
              rows={3}
              placeholder="What is this checklist for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${INPUT_BASE_CLASS} resize-none leading-relaxed`}
            />
          </div>

          {/* Department & Recurrence Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={LABEL_CLASS}>
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Department
              </label>
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="font-display text-xs">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>
                <Repeat className="w-3.5 h-3.5 text-amber-400" /> Recurrence
              </label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as ChecklistRecurrence)}>
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-display text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start / Due Date */}
          <div className="space-y-2">
            <label htmlFor="checklist-start-date" className={LABEL_CLASS}>
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> 
              {recurrence === 'ONE_TIME' ? 'Due Date' : 'Starts On'}
            </label>
            <input
              id="checklist-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${INPUT_BASE_CLASS} h-10 cursor-pointer text-text-secondary`}
            />
          </div>

          {/* Assigned Users */}
          <div className="space-y-2">
            <label className={LABEL_CLASS}>
              <Users className="w-3.5 h-3.5 text-sky-400" /> Assigned Users
            </label>
            <AssigneeMultiSelect 
              departmentId={departmentId || undefined} 
              selected={assigneeIds} 
              onChange={setAssigneeIds} 
            />
          </div>

          {/* Dynamic Items List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className={LABEL_CLASS}>
                Checklist Items
                <span className="ml-2 flex items-center justify-center size-5 rounded-full bg-surface-dark border border-border/50 text-[10px] text-text-muted">
                  {itemDrafts.length}
                </span>
              </label>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {itemDrafts.map((draft, i) => (
                <ChecklistDefinitionItemDraftRow 
                  key={i} 
                  index={i} 
                  draft={draft} 
                  onChange={updateDraft} 
                />
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setItemDrafts((d) => [...d, emptyItemDraft()])}
              className="flex items-center justify-center gap-2 h-10 w-full text-sm font-display font-medium text-primary-600 dark:text-primary-400 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 rounded-lg border-dashed transition-all active:scale-[0.98]"
            >
              <Plus size={16} />
              Add Another Item
            </button>
          </div>

          {/* Error Callout Banner */}
          {createDefinition.isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 font-display flex items-start sm:items-center gap-2.5 animate-in fade-in slide-in-from-top-1 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5 sm:mt-0" />
              <p className="leading-tight">
                {createDefinition.error instanceof Error
                  ? createDefinition.error.message
                  : 'Failed to create checklist. Please try again.'}
              </p>
            </div>
          )}
        </div>

        {/* Pinned Footer Actions */}
        <DialogFooter className="shrink-0 px-4 py-4 sm:px-7 border-t border-border/40 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={createDefinition.isPending}
            className="w-full sm:w-auto h-10 sm:h-9 px-4 text-sm sm:text-xs font-display border-border/60 hover:bg-surface-hover hover:text-text rounded-lg transition-all"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            isLoading={createDefinition.isPending}
            className="w-full sm:w-auto h-10 sm:h-9 px-4 text-sm sm:text-xs font-display bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-md shadow-primary-500/20 rounded-lg transition-all active:scale-[0.98] disabled:from-surface-dark disabled:to-surface-dark disabled:text-text-muted disabled:shadow-none disabled:border disabled:border-border/50"
          >
            Create Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};