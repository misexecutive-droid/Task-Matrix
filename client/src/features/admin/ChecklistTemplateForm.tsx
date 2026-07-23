import { useState } from 'react';
import { Plus, Trash2, ListChecks } from 'lucide-react';
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
import { useCreateChecklistTemplateMutation, useDepartmentsQuery } from './hooks';
import { useAssignableUsersQuery } from '../tickets/hook';
import type { ChecklistTemplateTarget } from '../../api/checklistTemplates';

const NO_DEPARTMENT = '__none__';
const UNASSIGNED = '__unassigned__';
const LABEL_CLASS = 'text-xs font-mono font-medium text-text-secondary uppercase tracking-wider';
const SELECT_CLASS = 'w-full px-3 h-9 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer';

interface ChecklistTemplateFormProps {
  onClose: () => void;
}

type ItemDraft = {
  label:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
  assigneeId:         string;
};

const emptyItemDraft = (): ItemDraft => ({
  label: '', requiredImageCount: '0', maxImageCount: '', requiresLivePhoto: false, assigneeId: '',
});

// Creating a template: name + which system it applies to, plus an optional starting set of
// items. departmentId scopes which users can be picked as an item's default assignee — that
// assignee is seeded onto the real checklist item when the template is later applied to a
// task/ticket. Editing an existing template's items happens inline in ChecklistTemplateList.
export const ChecklistTemplateForm = ({ onClose }: ChecklistTemplateFormProps) => {
  const [name, setName] = useState('');
  const [appliesTo, setAppliesTo] = useState<ChecklistTemplateTarget>('TASK');
  const [departmentId, setDepartmentId] = useState('');
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);
  const [nameError, setNameError] = useState<string | null>(null);

  const createMutation = useCreateChecklistTemplateMutation();
  const { data: departments } = useDepartmentsQuery();
  const { data: assignableUsers } = useAssignableUsersQuery(departmentId || undefined);

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id === NO_DEPARTMENT ? '' : id);
    setItemDrafts(drafts => drafts.map(d => ({ ...d, assigneeId: '' })));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Template name is required');
      return;
    }
    const items = itemDrafts
      .filter(d => d.label.trim())
      .map((d, index) => ({
        label:              d.label.trim(),
        order:              index,
        requiredImageCount: Number(d.requiredImageCount) || 0,
        maxImageCount:      d.maxImageCount ? Number(d.maxImageCount) : undefined,
        requiresLivePhoto:  d.requiresLivePhoto,
        defaultAssigneeId:  d.assigneeId || undefined,
      }));

    createMutation.mutate(
      {
        name: name.trim(),
        appliesTo,
        departmentId: departmentId || undefined,
        items: items.length ? items : undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg font-mono">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <ListChecks className="w-5 h-5 text-primary-500 shrink-0" />
            <div>
              <DialogTitle className="font-mono">New Checklist Template</DialogTitle>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                A ready-made list of steps you save once here, then attach to any task or ticket
                in one click — instead of typing the same steps every time.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            id="name"
            label="Template Name"
            placeholder="e.g. Daily Store Opening"
            className="font-mono text-sm h-9"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(null); }}
            error={nameError ?? undefined}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>Use For</label>
              <Select value={appliesTo} onValueChange={v => setAppliesTo(v as ChecklistTemplateTarget)}>
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">Tasks</SelectItem>
                  <SelectItem value="TICKET">Tickets</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-text-muted">Where this checklist can be added — Tasks or Tickets.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>Department (optional)</label>
              <Select value={departmentId || NO_DEPARTMENT} onValueChange={handleDepartmentChange}>
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue placeholder="No department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                  {departments?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-text-muted">Pick a department to assign steps to its people below.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={LABEL_CLASS}>Checklist Steps ({itemDrafts.length})</label>
            <p className="text-[11px] text-text-muted -mt-1">
              What someone needs to do when this checklist is used. You can add more steps later too.
            </p>
            {itemDrafts.map((draft, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-surface-hover/50 rounded-lg border border-border">
                <div className="flex items-center gap-1.5">
                  <input
                    value={draft.label}
                    onChange={e => updateDraft(i, { label: e.target.value })}
                    placeholder={`Item ${i + 1} label…`}
                    className="flex-1 px-3 py-2 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-text-muted transition-all"
                  />
                  {itemDrafts.length > 1 && (
                    <button
                      onClick={() => setItemDrafts(d => d.filter((_, idx) => idx !== i))}
                      className="shrink-0 text-text-light hover:text-danger transition-colors cursor-pointer"
                      aria-label="Remove item"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-muted">Photos required</span>
                    <input
                      type="number"
                      min={0}
                      value={draft.requiredImageCount}
                      onChange={e => updateDraft(i, { requiredImageCount: e.target.value })}
                      className="w-16 px-2 py-1.5 text-xs font-mono bg-surface text-text rounded-md border border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-muted">Photos max</span>
                    <input
                      type="number"
                      min={0}
                      value={draft.maxImageCount}
                      onChange={e => updateDraft(i, { maxImageCount: e.target.value })}
                      placeholder="No limit"
                      className="w-20 px-2 py-1.5 text-xs font-mono bg-surface text-text rounded-md border border-border placeholder:text-text-light"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-text-secondary px-1 cursor-pointer pb-1.5">
                    <input
                      type="checkbox"
                      checked={draft.requiresLivePhoto}
                      onChange={e => updateDraft(i, { requiresLivePhoto: e.target.checked })}
                    />
                    Must be taken live (no gallery upload)
                  </label>

                  <div className="flex flex-col gap-0.5 ml-auto">
                    <span className="text-[10px] text-text-muted">
                      {departmentId ? 'Default assignee' : 'Pick a department to assign'}
                    </span>
                    <Select
                      value={draft.assigneeId || UNASSIGNED}
                      onValueChange={v => updateDraft(i, { assigneeId: v === UNASSIGNED ? '' : v })}
                      disabled={!departmentId}
                    >
                      <SelectTrigger size="sm" className="px-2 py-1.5 text-xs font-mono h-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                        {assignableUsers?.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
              className="flex items-center justify-center gap-2 py-2 text-sm font-mono font-medium text-primary-600 hover:text-primary-700 cursor-pointer w-fit"
            >
              <Plus size={14} />
              Add another item
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-danger text-center font-mono">
              {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create template.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="font-mono">Cancel</Button>
          <Button type="button" variant="primary" size="sm" isLoading={createMutation.isPending} onClick={handleSubmit} className="font-mono">
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
