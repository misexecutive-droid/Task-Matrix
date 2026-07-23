import { useState } from 'react';
import { Plus, AlertCircle, Trash2, ChevronDown, ChevronRight, Loader2, ListChecks, CheckSquare } from 'lucide-react';
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
  item:             ChecklistTemplateItem;
  departmentId:     string | null;
  assignableUsers?: AssignableUser[];
}

const ItemRow = ({ item, departmentId, assignableUsers }: ItemRowProps) => {
  const updateItem = useUpdateChecklistTemplateItemMutation();
  const deleteItem = useDeleteChecklistTemplateItemMutation();

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-border/60 first:border-t-0 hover:bg-surface-hover/40 transition-colors">
      <span className="flex-1 min-w-[140px] text-sm font-mono text-text">{item.label}</span>

      <input
        type="number"
        min={0}
        defaultValue={item.requiredImageCount}
        onBlur={e => {
          const value = Number(e.target.value) || 0;
          if (value !== item.requiredImageCount) updateItem.mutate({ id: item.id, payload: { requiredImageCount: value } });
        }}
        className="w-16 px-2 py-1 text-xs font-mono bg-surface text-text rounded-md border border-border"
        title="Required photo count"
      />
      <input
        type="number"
        min={0}
        defaultValue={item.maxImageCount ?? ''}
        placeholder="Max"
        onBlur={e => {
          const value = e.target.value ? Number(e.target.value) : null;
          if (value !== item.maxImageCount) updateItem.mutate({ id: item.id, payload: { maxImageCount: value } });
        }}
        className="w-16 px-2 py-1 text-xs font-mono bg-surface text-text rounded-md border border-border placeholder:text-text-light"
        title="Maximum photo count"
      />
      <label className="flex items-center gap-1.5 text-xs font-mono text-text-secondary px-1 cursor-pointer">
        <div className={`flex items-center justify-center size-4 rounded border ${item.requiresLivePhoto ? 'bg-primary-500 border-primary-500' : 'bg-surface border-border'}`}>
          {item.requiresLivePhoto && <CheckSquare size={11} className="text-white" />}
        </div>
        <input
          type="checkbox"
          className="hidden"
          checked={item.requiresLivePhoto}
          onChange={e => updateItem.mutate({ id: item.id, payload: { requiresLivePhoto: e.target.checked } })}
        />
        Live only
      </label>

      <Select
        value={item.defaultAssigneeId ?? UNASSIGNED}
        onValueChange={v => updateItem.mutate({ id: item.id, payload: { defaultAssigneeId: v === UNASSIGNED ? null : v } })}
        disabled={!departmentId}
      >
        <SelectTrigger
          size="sm"
          title={departmentId ? 'Default assignee' : 'Set a department on this template first'}
          className="px-2 py-1 text-xs font-mono h-auto"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {assignableUsers?.map(u => (
            <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={() => deleteItem.mutate(item.id)}
        disabled={deleteItem.isPending}
        className="shrink-0 text-text-light hover:text-danger transition-colors cursor-pointer disabled:opacity-50"
        aria-label="Delete item"
      >
        <Trash2 size={13} />
      </button>
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
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          <div className="p-1 rounded bg-surface-hover border border-border text-text-muted shrink-0">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </div>
          <span className="text-sm font-mono font-medium text-text truncate">{template.name}</span>
          <span className={[
            'text-xs font-mono font-medium px-2 py-0.5 rounded-full shrink-0',
            template.appliesTo === 'TASK'
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          ].join(' ')}>
            {template.appliesTo === 'TASK' ? 'Tasks' : 'Tickets'}
          </span>
          {departmentName && (
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary border border-border shrink-0">
              {departmentName}
            </span>
          )}
          <span className="text-xs text-text-muted font-mono shrink-0">
            {template.items.length} item{template.items.length !== 1 ? 's' : ''}
          </span>
        </button>

        <button
          onClick={() => deleteTemplate.mutate(template.id)}
          disabled={deleteTemplate.isPending}
          className="shrink-0 p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Delete template"
        >
          {deleteTemplate.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface-hover/20">
          {template.items.length === 0 && (
            <p className="px-4 py-3 text-xs text-text-muted font-mono">No items yet.</p>
          )}
          {template.items.map(item => (
            <ItemRow key={item.id} item={item} departmentId={template.departmentId} assignableUsers={assignableUsers} />
          ))}

          <div className="flex items-center gap-2 px-4 py-3 border-t border-border/60 bg-surface-hover/40">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
              placeholder="New item label…"
              className="flex-1 px-3 py-2 text-sm font-mono bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-text-muted/60 transition-all"
            />
            <Button size="sm" variant="outline" onClick={handleAddItem} isLoading={addItem.isPending} className="font-mono">
              <Plus size={12} />
              Add item
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ChecklistTemplateList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: templates = [], isPending, isError } = useChecklistTemplatesQuery();
  const { data: departments = [] } = useDepartmentsQuery();
  const departmentNames = new Map(departments.map(d => [d.id, d.name]));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <ListChecks size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-mono font-semibold text-text">Checklist Templates</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Save a checklist once here, then add it to any task or ticket in one click — instead of retyping the same steps every time.
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {templates.length} template{templates.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          New Template
        </Button>
      </div>

      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border bg-surface">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              <Skeleton className="size-4 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono">
          <AlertCircle size={15} />
          Failed to load checklist templates.
        </div>
      )}

      {!isPending && !isError && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
          <ListChecks size={28} className="text-text-light" />
          <p className="text-sm font-mono">No checklist templates yet — create your first one.</p>
        </div>
      )}

      {!isPending && !isError && templates.length > 0 && (
        <div className="flex flex-col gap-2">
          {templates.map(t => (
            <TemplateBlock key={t.id} template={t} departmentName={t.departmentId ? (departmentNames.get(t.departmentId) ?? null) : null} />
          ))}
        </div>
      )}

      {showForm && <ChecklistTemplateForm onClose={() => setShowForm(false)} />}
    </div>
  );
};
