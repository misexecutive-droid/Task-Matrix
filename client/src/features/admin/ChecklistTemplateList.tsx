import { useState } from 'react';
import { Plus, AlertCircle, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button, Skeleton } from '../../components';
import {
  useChecklistTemplatesQuery,
  useDeleteChecklistTemplateMutation,
  useAddChecklistTemplateItemMutation,
  useUpdateChecklistTemplateItemMutation,
  useDeleteChecklistTemplateItemMutation,
} from './hooks';
import { ChecklistTemplateForm } from './ChecklistTemplateForm';
import type { ChecklistTemplate, ChecklistTemplateItem } from '../../api/checklistTemplates';

const ItemRow = ({ item }: { item: ChecklistTemplateItem }) => {
  const updateItem = useUpdateChecklistTemplateItemMutation();
  const deleteItem = useDeleteChecklistTemplateItemMutation();

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-border first:border-t-0">
      <span className="flex-1 min-w-[120px] text-sm font-display text-text">{item.label}</span>

      <input
        type="number"
        min={0}
        defaultValue={item.requiredImageCount}
        onBlur={e => {
          const value = Number(e.target.value) || 0;
          if (value !== item.requiredImageCount) updateItem.mutate({ id: item.id, payload: { requiredImageCount: value } });
        }}
        className="w-16 px-2 py-1 text-xs bg-surface text-text rounded border border-border"
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
        className="w-16 px-2 py-1 text-xs bg-surface text-text rounded border border-border placeholder:text-text-light"
        title="Maximum photo count"
      />
      <label className="flex items-center gap-1 text-xs text-text-secondary px-1">
        <input
          type="checkbox"
          checked={item.requiresLivePhoto}
          onChange={e => updateItem.mutate({ id: item.id, payload: { requiresLivePhoto: e.target.checked } })}
        />
        Live only
      </label>

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

const TemplateBlock = ({ template }: { template: ChecklistTemplate }) => {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const deleteTemplate = useDeleteChecklistTemplateMutation();
  const addItem = useAddChecklistTemplateItemMutation();

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    addItem.mutate(
      { templateId: template.id, payload: { label: newLabel.trim(), order: template.items.length } },
      { onSuccess: () => setNewLabel('') },
    );
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          {open
            ? <ChevronDown size={14} className="text-text-muted shrink-0" />
            : <ChevronRight size={14} className="text-text-muted shrink-0" />}
          <span className="text-sm font-display font-medium text-text truncate">{template.name}</span>
          <span className={[
            'text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0',
            template.appliesTo === 'TASK'
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          ].join(' ')}>
            {template.appliesTo === 'TASK' ? 'Tasks' : 'Tickets'}
          </span>
          <span className="text-xs text-text-muted font-display shrink-0">
            {template.items.length} item{template.items.length !== 1 ? 's' : ''}
          </span>
        </button>

        <Button
          onClick={() => deleteTemplate.mutate(template.id)}
          disabled={deleteTemplate.isPending}
          className="shrink-0 text-text-light hover:text-danger transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Delete template"
        >
          {deleteTemplate.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border">
          {template.items.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-text-muted font-display">No items yet.</p>
          )}
          {template.items.map(item => <ItemRow key={item.id} item={item} />)}

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-surface-hover">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
              placeholder="New item label…"
              className="flex-1 px-2.5 py-1.5 text-xs bg-surface text-text rounded-md border border-border focus:outline-none focus:border-primary-500 placeholder:text-text-light"
            />
            <Button size="sm" variant="outline" onClick={handleAddItem} isLoading={addItem.isPending}>
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

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-text">Checklist templates</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''} — reusable checklists that can be applied to any task or ticket
          </p>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          New template
        </Button>
      </div>

      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border bg-surface">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              <Skeleton className="size-4 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          <AlertCircle size={15} />
          Failed to load checklist templates.
        </div>
      )}

      {!isPending && !isError && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
          <p className="text-sm font-display">No checklist templates yet — create your first one.</p>
        </div>
      )}

      {!isPending && !isError && templates.length > 0 && (
        <div className="flex flex-col gap-2">
          {templates.map(t => <TemplateBlock key={t.id} template={t} />)}
        </div>
      )}

      {showForm && <ChecklistTemplateForm onClose={() => setShowForm(false)} />}
    </div>
  );
};