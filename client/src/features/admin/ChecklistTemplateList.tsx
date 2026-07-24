import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  AlertCircle, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  ListChecks, 
  Camera, 
  Building2, 
  UserCheck, 
  CheckSquare, 
  Layers, 
  Sparkles,
  Inbox
} from 'lucide-react';
import { Button, Skeleton } from '../../components';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  useChecklistTemplatesQuery,
  useDeleteChecklistTemplateMutation,
  useAddChecklistTemplateItemMutation,
  useUpdateChecklistTemplateItemMutation,
  useDeleteChecklistTemplateItemMutation,
  useDepartmentsQuery,
} from './hooks';
import { useAssignableUsersQuery } from '../tickets/hook';
import { ChecklistTemplateForm } from './ChecklistTemplateForm';
import type { ChecklistTemplate, ChecklistTemplateItem } from '../../api/checklistTemplates';
import type { AssignableUser } from '../../api/users';

const UNASSIGNED = '__unassigned__';

interface ItemRowProps {
  item: ChecklistTemplateItem;
  departmentId: string | null;
  assignableUsers?: AssignableUser[];
  index: number;
}

const ItemRow = ({ item, departmentId, assignableUsers, index }: ItemRowProps) => {
  const updateItem = useUpdateChecklistTemplateItemMutation();
  const deleteItem = useDeleteChecklistTemplateItemMutation();

  return (
    <div className="group flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-t border-border/50 hover:bg-surface-hover/30 transition-colors">
      
      {/* Step Index & Label */}
      <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-surface-hover text-text-muted text-[11px] font-mono font-semibold shrink-0">
          {index + 1}
        </span>
        <span className="text-sm font-mono text-text font-medium leading-snug">{item.label}</span>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto shrink-0">
        
        {/* Photo Requirements Group */}
        <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-lg border border-border/60">
          <Camera size={13} className="text-text-muted shrink-0" />
          
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-text-muted uppercase">Min</span>
            <input
              type="number"
              min={0}
              defaultValue={item.requiredImageCount}
              onBlur={e => {
                const value = Number(e.target.value) || 0;
                if (value !== item.requiredImageCount) updateItem.mutate({ id: item.id, payload: { requiredImageCount: value } });
              }}
              className="w-9 h-6 text-center text-xs font-mono bg-surface text-text rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary-500/40"
              title="Minimum photos required"
            />
          </div>

          <span className="text-text-muted text-[10px]">•</span>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-text-muted uppercase">Max</span>
            <input
              type="number"
              min={0}
              defaultValue={item.maxImageCount ?? ''}
              placeholder="∞"
              onBlur={e => {
                const value = e.target.value ? Number(e.target.value) : null;
                if (value !== item.maxImageCount) updateItem.mutate({ id: item.id, payload: { maxImageCount: value } });
              }}
              className="w-9 h-6 text-center text-xs font-mono bg-surface text-text rounded border border-border placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500/40"
              title="Maximum photos allowed"
            />
          </div>
        </div>

        {/* Live Photo Checkbox */}
        <button
          type="button"
          onClick={() => updateItem.mutate({ id: item.id, payload: { requiresLivePhoto: !item.requiresLivePhoto } })}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
            item.requiresLivePhoto 
              ? 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400 font-medium' 
              : 'bg-background border-border/60 text-text-muted hover:text-text'
          }`}
        >
          <div className={`flex items-center justify-center size-3.5 rounded ${item.requiresLivePhoto ? 'bg-primary-500 text-white' : 'border border-border bg-surface'}`}>
            {item.requiresLivePhoto && <CheckSquare size={10} />}
          </div>
          <span>Live only</span>
        </button>

        {/* Assignee Selector */}
        <Select
          value={item.defaultAssigneeId ?? UNASSIGNED}
          onValueChange={v => updateItem.mutate({ id: item.id, payload: { defaultAssigneeId: v === UNASSIGNED ? null : v } })}
          disabled={!departmentId}
        >
          <SelectTrigger
            size="sm"
            title={departmentId ? 'Default assignee' : 'Set a department on this template first'}
            className="h-7 px-2 text-xs font-mono bg-background border-border/60 min-w-[110px]"
          >
            <div className="flex items-center gap-1.5 truncate">
              <UserCheck size={12} className="text-text-muted shrink-0" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {assignableUsers?.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Button */}
        <button
          onClick={() => deleteItem.mutate(item.id)}
          disabled={deleteItem.isPending}
          className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Delete item"
        >
          <Trash2 size={14} />
        </button>

      </div>
    </div>
  );
};

const TemplateBlock = ({ template, departmentName }: { template: ChecklistTemplate; departmentName: string | null }) => {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const deleteTemplate = useDeleteChecklistTemplateMutation();
  const addItem = useAddChecklistTemplateItemMutation();
  const { data: assignableUsers } = useAssignableUsersQuery(template.departmentId ?? undefined);

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    addItem.mutate(
      { templateId: template.id, payload: { label: newLabel.trim(), order: template.items.length } },
      { onSuccess: () => setNewLabel('') },
    );
  };

  return (
    <div className="rounded-xl border border-border/80 bg-surface shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
      
      {/* Template Header Card */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface hover:bg-surface-hover/30 transition-colors">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left"
        >
          <div className="p-1.5 rounded-lg bg-surface-hover border border-border/60 text-text-muted shrink-0">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </div>
          
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-sm font-mono font-semibold text-text truncate">{template.name}</span>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                template.appliesTo === 'TASK'
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300 ring-1 ring-primary-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
              }`}>
                <Layers size={11} />
                {template.appliesTo === 'TASK' ? 'Tasks' : 'Tickets'}
              </span>

              {departmentName && (
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface-hover text-text-secondary border border-border/60 flex items-center gap-1">
                  <Building2 size={11} />
                  {departmentName}
                </span>
              )}
            </div>
          </div>

          <span className="text-xs text-text-muted font-mono shrink-0 ml-auto mr-2">
            {template.items.length} {template.items.length === 1 ? 'step' : 'steps'}
          </span>
        </button>

        <button
          onClick={() => deleteTemplate.mutate(template.id)}
          disabled={deleteTemplate.isPending}
          className="shrink-0 p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Delete template"
        >
          {deleteTemplate.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Accordion Expandable Section */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-surface-subtle/20"
          >
            {template.items.length === 0 && (
              <div className="px-6 py-6 text-center text-xs text-text-muted font-mono flex flex-col items-center gap-1">
                <Sparkles size={16} className="text-text-muted/60" />
                <span>No checklist steps added yet. Add your first step below!</span>
              </div>
            )}

            {template.items.map((item, idx) => (
              <ItemRow 
                key={item.id} 
                item={item} 
                index={idx}
                departmentId={template.departmentId} 
                assignableUsers={assignableUsers} 
              />
            ))}

            {/* Quick Add Step Row */}
            <div className="flex items-center gap-2 p-3 border-t border-border/60 bg-surface-hover/20">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
                placeholder="Add next step label…"
                className="flex-1 px-3 py-1.5 text-xs font-mono bg-background text-text rounded-lg border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary-500/20 placeholder:text-text-muted transition-all"
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAddItem} 
                isLoading={addItem.isPending} 
                className="font-mono text-xs h-8 gap-1.5"
              >
                <Plus size={13} />
                Add Step
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ChecklistTemplateList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: templates = [], isPending, isError } = useChecklistTemplatesQuery();
  const { data: departments = [] } = useDepartmentsQuery();
  const departmentNames = new Map(departments.map(d => [d.id, d.name]));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6">
      
      {/* Header Banner */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap pb-4 border-b border-border/60">
        <div className="flex items-start gap-3.5">
          <div className="size-11 rounded-xl bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/20 flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <ListChecks size={22} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-mono font-bold text-text tracking-tight">Checklist Templates</h1>
              <span className="text-xs font-mono bg-surface-hover border border-border/80 px-2 py-0.5 rounded-full text-text-muted">
                {templates.length}
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono max-w-xl leading-relaxed">
              Standardize operational procedures. Create templates once and apply them instantly across tasks and tickets.
            </p>
          </div>
        </div>

        <Button 
          size="sm" 
          variant="primary" 
          className="gap-2 font-mono text-xs shadow-xs shrink-0" 
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} />
          New Template
        </Button>
      </div>

      {/* Loading Skeletons */}
      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-surface">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="size-6 rounded-lg shrink-0" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-md shrink-0" />
              </div>
              <Skeleton className="h-4 w-12 rounded shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Error Alert Card */}
      {isError && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-mono">
          <AlertCircle size={16} className="shrink-0" />
          <span>Failed to load checklist templates. Please check your network connection and try again.</span>
        </div>
      )}

      {/* Zero State */}
      {!isPending && !isError && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-border bg-surface-subtle/20 text-center">
          <div className="p-3 bg-surface border border-border rounded-xl text-text-muted mb-3 shadow-xs">
            <Inbox size={26} />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text">No templates configured</h3>
          <p className="text-xs text-text-muted font-mono mt-1 max-w-sm">
            You haven't created any checklist templates yet. Click below to add your first standard procedure.
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-4 gap-2 font-mono text-xs" 
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Create Template
          </Button>
        </div>
      )}

      {/* Templates List */}
      {!isPending && !isError && templates.length > 0 && (
        <div className="flex flex-col gap-3">
          {templates.map(t => (
            <TemplateBlock 
              key={t.id} 
              template={t} 
              departmentName={t.departmentId ? (departmentNames.get(t.departmentId) ?? null) : null} 
            />
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showForm && <ChecklistTemplateForm onClose={() => setShowForm(false)} />}
    </div>
  );
};