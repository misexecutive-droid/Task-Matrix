import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, AlertCircle, Trash2, Loader2, Repeat, Users, Pause, Play, ChevronRight } from 'lucide-react';
import { Button, Skeleton } from '../../components';
import {
  useChecklistDefinitionsQuery,
  useDeleteChecklistDefinitionMutation,
  useSetChecklistDefinitionActiveMutation,
  useDepartmentsQuery,
} from './hook';
import { ChecklistDefinitionForm } from './ChecklistDefinitionForm';
import type { ChecklistDefinition, ChecklistRecurrence } from '../../api/checklistDefinitions';

const RECURRENCE_LABEL: Record<ChecklistRecurrence, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One-time',
};

const DefinitionRow = ({ definition, departmentName }: { definition: ChecklistDefinition; departmentName: string }) => {
  const deleteDefinition = useDeleteChecklistDefinitionMutation();
  const setActive = useSetChecklistDefinitionActiveMutation();

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all group">
      <Link
        to={`/admin/scheduled-checklists/${definition.id}`}
        className="flex-1 min-w-0 flex items-center gap-3"
      >
        <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 border ${
          definition.isActive ? 'bg-primary-500/10 border-primary-500/20 text-primary-600' : 'bg-surface-hover border-border text-text-muted'
        }`}>
          <Repeat size={15} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium text-text truncate">{definition.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-text-muted font-mono">{departmentName}</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-300">
              {RECURRENCE_LABEL[definition.recurrence]}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted font-mono">
              <Users size={11} /> {definition.assigneeIds.length}
            </span>
            {!definition.isActive && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border">
                Paused
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={16} className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      <button
        onClick={() => setActive.mutate({ id: definition.id, isActive: !definition.isActive })}
        disabled={setActive.isPending}
        className="shrink-0 p-1.5 text-text-light hover:text-text hover:bg-surface-hover rounded-md transition-colors cursor-pointer disabled:opacity-50"
        title={definition.isActive ? 'Pause' : 'Resume'}
        aria-label={definition.isActive ? 'Pause checklist' : 'Resume checklist'}
      >
        {definition.isActive ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button
        onClick={() => deleteDefinition.mutate(definition.id)}
        disabled={deleteDefinition.isPending}
        className="shrink-0 p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
        aria-label="Delete checklist"
      >
        {deleteDefinition.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
};

export const ChecklistDefinitionList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: definitions = [], isPending, isError } = useChecklistDefinitionsQuery();
  const { data: departments = [] } = useDepartmentsQuery();

  const departmentNames = new Map(departments.map(d => [d.id, d.name]));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <Repeat size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-mono font-semibold text-text">Recurring Checklists</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {definitions.length} checklist{definitions.length !== 1 ? 's' : ''} — auto-generated on a schedule for assigned team members
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          New Checklist
        </Button>
      </div>

      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface">
              <Skeleton className="size-9 rounded-lg shrink-0" />
              <Skeleton className="h-4 flex-1 max-w-64" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono">
          <AlertCircle size={15} />
          Failed to load checklists.
        </div>
      )}

      {!isPending && !isError && definitions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
          <Repeat size={28} className="text-text-light" />
          <p className="text-sm font-mono">No recurring checklists yet — create your first one.</p>
        </div>
      )}

      {!isPending && !isError && definitions.length > 0 && (
        <div className="flex flex-col gap-2">
          {definitions.map(d => (
            <DefinitionRow key={d.id} definition={d} departmentName={departmentNames.get(d.departmentId) ?? 'Unknown department'} />
          ))}
        </div>
      )}

      {showForm && <ChecklistDefinitionForm onClose={() => setShowForm(false)} />}
    </div>
  );
};
