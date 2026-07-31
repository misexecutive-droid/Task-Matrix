import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  ListChecks,
  Building2,
  Layers,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '../../../components';
import { useAssignableUsersQuery } from '../../tickets/hook';
import { ItemDraftRow, emptyItemDraft, type ItemDraft } from './ItemDraftRow';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ChecklistTemplateTarget = 'TASK' | 'TICKET';
const NO_DEPARTMENT = '__none__';

interface FormUIProps {
  departments: { id: string; name: string }[];
  isSaving: boolean;
  saveError?: string;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export const ChecklistTemplateFormUI = ({ departments, isSaving, saveError, onSubmit, onClose }: FormUIProps) => {
  const [name, setName] = useState('');
  const [appliesTo, setAppliesTo] = useState<ChecklistTemplateTarget>('TASK');
  const [departmentId, setDepartmentId] = useState('');
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: assignableUsers } = useAssignableUsersQuery(departmentId || undefined);

  const updateDraft = useCallback((i: number, patch: Partial<ItemDraft>) => {
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }, []);

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id === NO_DEPARTMENT ? '' : id);
    setItemDrafts(drafts => drafts.map(d => ({ ...d, assigneeId: '' })));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setValidationError('Please provide a name for this template.');
      return;
    }
    setValidationError(null);

    const cleanedItems = itemDrafts
      .filter(d => d.label.trim())
      .map((d, index) => ({
        label: d.label.trim(),
        order: index,
        requiredImageCount: Number(d.requiredImageCount) || 0,
        maxImageCount: d.maxImageCount ? Number(d.maxImageCount) : undefined,
        requiresLivePhoto: d.requiresLivePhoto,
        defaultAssigneeId: d.assigneeId || undefined,
      }));

    onSubmit({ name, appliesTo, departmentId, items: cleanedItems });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div 
        role="dialog" 
        aria-modal="true"
        className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/60 dark:border-slate-800/60 font-sans animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <header className="relative p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900 dark:to-slate-950">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm shrink-0">
              <ListChecks className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 pr-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Create Standard Procedure
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                A reusable set of steps you attach to one task or ticket at a time. For automated scheduling, use Recurring Checklists instead.
              </p>
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Basic Info */}
          <section className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-5">
            <Input
              id="name"
              label="Template Name"
              value={name}
              onChange={e => { setName(e.target.value); setValidationError(null); }}
              placeholder="e.g., Daily Store Opening, Restroom Cleaning..."
              error={validationError ?? undefined}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Applies To
                </label>
                <Select value={appliesTo} onValueChange={v => setAppliesTo(v as ChecklistTemplateTarget)}>
                  <SelectTrigger className="w-full h-11 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TASK">Tasks</SelectItem>
                    <SelectItem value="TICKET">Tickets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Owning Department
                </label>
                <Select value={departmentId || NO_DEPARTMENT} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="w-full h-11 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                    <SelectValue placeholder="Global (No Department)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>Global (No Department)</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Procedure Steps */}
          <section className="space-y-4">
            <div className="flex items-end justify-between px-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Procedure Steps</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define the individual steps required to complete this procedure.</p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                {itemDrafts.length} {itemDrafts.length === 1 ? 'Step' : 'Steps'}
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {itemDrafts.map((draft, i) => (
                  <ItemDraftRow
                    key={draft.id}
                    draft={draft}
                    index={i}
                    departmentId={departmentId}
                    assignableUsers={assignableUsers}
                    canRemove={itemDrafts.length > 1}
                    onChange={patch => updateDraft(i, patch)}
                    onRemove={() => setItemDrafts(d => d.filter((_, idx) => idx !== i))}
                  />
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setItemDrafts(d => [...d, emptyItemDraft()])}
              className={cn(
                "w-full py-4 mt-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl",
                "text-slate-500 dark:text-slate-400 font-medium text-sm transition-all duration-300 ease-in-out",
                "hover:border-indigo-500/40 hover:bg-indigo-50/50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400",
                "flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              )}
            >
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
              Add another step
            </button>
          </section>

          {saveError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{saveError}</span>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium w-full sm:w-auto">
            <Info className="w-4 h-4 text-indigo-500/70" />
            <span>Empty steps are automatically skipped.</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              Cancel
            </button>
            <button 
              type="button" 
              disabled={isSaving}
              onClick={handleSave} 
              className={cn(
                "flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm",
                "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500",
                "transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                "disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
              )}
            >
              {isSaving ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};