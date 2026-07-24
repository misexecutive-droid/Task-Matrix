import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  ListChecks, 
  Camera, 
  UserCheck, 
  Building2, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
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

interface ChecklistTemplateFormProps {
  onClose: () => void;
}

type ItemDraft = {
  label: string;
  requiredImageCount: string;
  maxImageCount: string;
  requiresLivePhoto: boolean;
  assigneeId: string;
};

const emptyItemDraft = (): ItemDraft => ({
  label: '', 
  requiredImageCount: '0', 
  maxImageCount: '', 
  requiresLivePhoto: false, 
  assigneeId: '',
});

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
        label: d.label.trim(),
        order: index,
        requiredImageCount: Number(d.requiredImageCount) || 0,
        maxImageCount: d.maxImageCount ? Number(d.maxImageCount) : undefined,
        requiresLivePhoto: d.requiresLivePhoto,
        defaultAssigneeId: d.assigneeId || undefined,
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
      <DialogContent className="sm:max-w-2xl font-mono max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background rounded-xl border border-border shadow-2xl">
        
        {/* Header Section */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-surface-subtle/40">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-primary-500/10 rounded-xl text-primary-500 ring-1 ring-primary-500/20 shrink-0 mt-0.5">
              <ListChecks className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="font-mono text-lg font-semibold tracking-tight text-text">
                Create Checklist Template
              </DialogTitle>
              <p className="text-xs text-text-muted font-mono leading-relaxed">
                Build a reusable checklist to streamline repetitive procedures. Attach it to tasks or tickets in a single click.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* General Information Card */}
          <div className="space-y-4">
            <Input
              id="name"
              label="TEMPLATE NAME"
              placeholder="e.g. Daily Store Opening Checklist"
              className="font-mono text-sm h-10 bg-surface focus:ring-primary-500/20 transition-all"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(null); }}
              error={nameError ?? undefined}
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary-500" />
                  Target System
                </label>
                <Select value={appliesTo} onValueChange={v => setAppliesTo(v as ChecklistTemplateTarget)}>
                  <SelectTrigger className="w-full px-3 h-10 text-sm font-mono bg-surface text-text rounded-lg border border-border focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TASK">Tasks</SelectItem>
                    <SelectItem value="TICKET">Tickets</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-text-muted">Scope where this template can be applied.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-primary-500" />
                  Department (Optional)
                </label>
                <Select value={departmentId || NO_DEPARTMENT} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="w-full px-3 h-10 text-sm font-mono bg-surface text-text rounded-lg border border-border focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer">
                    <SelectValue placeholder="No department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>No Department</SelectItem>
                    {departments?.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-text-muted">Select to filter default assignees for items.</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Checklist Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
                  Checklist Steps ({itemDrafts.length})
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Define individual tasks, media rules, and assignees.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {itemDrafts.map((draft, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.15 }}
                    className="group relative flex flex-col gap-3 p-4 bg-surface hover:bg-surface-hover/30 rounded-xl border border-border/80 shadow-xs transition-colors"
                  >
                    {/* Item Row Top: Header Badge & Label Input */}
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-hover text-text-muted text-xs font-mono font-bold shrink-0">
                        {i + 1}
                      </span>
                      <input
                        value={draft.label}
                        onChange={e => updateDraft(i, { label: e.target.value })}
                        placeholder={`Step ${i + 1} description…`}
                        className="flex-1 px-3 py-2 text-sm font-mono bg-background text-text rounded-lg border border-border/70 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 placeholder:text-text-muted transition-all"
                      />
                      {itemDrafts.length > 1 && (
                        <button
                          onClick={() => setItemDrafts(d => d.filter((_, idx) => idx !== i))}
                          className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                          aria-label="Remove item"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Item Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2 border-t border-border/40">
                      
                      {/* Photo Validation Settings */}
                      <div className="sm:col-span-7 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border/60">
                          <Camera size={14} className="text-text-muted ml-1" />
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-text-muted">Min:</span>
                            <input
                              type="number"
                              min={0}
                              value={draft.requiredImageCount}
                              onChange={e => updateDraft(i, { requiredImageCount: e.target.value })}
                              className="w-10 px-1.5 py-0.5 text-xs font-mono text-center bg-surface text-text rounded border border-border"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-text-muted">Max:</span>
                            <input
                              type="number"
                              min={0}
                              value={draft.maxImageCount}
                              onChange={e => updateDraft(i, { maxImageCount: e.target.value })}
                              placeholder="∞"
                              className="w-10 px-1.5 py-0.5 text-xs font-mono text-center bg-surface text-text rounded border border-border placeholder:text-text-muted"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={draft.requiresLivePhoto}
                            onChange={e => updateDraft(i, { requiresLivePhoto: e.target.checked })}
                            className="rounded border-border text-primary-500 focus:ring-primary-500/20"
                          />
                          <span>Live photo only</span>
                        </label>
                      </div>

                      {/* Default Assignee Dropdown */}
                      <div className="sm:col-span-5 flex flex-col gap-1">
                        <Select
                          value={draft.assigneeId || UNASSIGNED}
                          onValueChange={v => updateDraft(i, { assigneeId: v === UNASSIGNED ? '' : v })}
                          disabled={!departmentId}
                        >
                          <SelectTrigger className="w-full h-8 px-2.5 text-xs font-mono bg-background border-border/70">
                            <div className="flex items-center gap-1.5 truncate">
                              <UserCheck size={13} className="text-text-muted shrink-0" />
                              <SelectValue placeholder="Assignee" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                            {assignableUsers?.map(u => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.firstName} {u.lastName ?? ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Item Button */}
            <button
              type="button"
              onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
              className="w-full py-2.5 border-2 border-dashed border-border hover:border-primary-500/40 hover:bg-primary-500/5 text-primary-600 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-mono font-semibold cursor-pointer group"
            >
              <Plus size={15} className="transition-transform group-hover:scale-110" />
              Add Next Step
            </button>
          </div>

          {/* Dynamic Error State */}
          {createMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs font-mono">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                {createMutation.error instanceof Error 
                  ? createMutation.error.message 
                  : 'Failed to save template. Please check input values.'}
              </span>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <DialogFooter className="p-4 px-6 border-t border-border/60 bg-surface-subtle/30 flex items-center justify-between sm:justify-between gap-3">
          <p className="text-[11px] text-text-muted font-mono hidden sm:flex items-center gap-1">
            <HelpCircle size={13} />
            Steps with empty labels will be skipped.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onClose} 
              className="font-mono text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              size="sm" 
              isLoading={createMutation.isPending} 
              onClick={handleSubmit} 
              className="font-mono text-xs shadow-xs"
            >
              Save Template
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};