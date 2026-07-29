import { useState } from 'react';
import { Plus, AlertCircle, Repeat } from 'lucide-react';
import { Button, Skeleton } from '../../../components';
import { useChecklistDefinitionsQuery, useDepartmentsQuery } from '../hook';
import { ChecklistDefinitionForm } from './ChecklistDefinitionForm';
import { ChecklistDefinitionRow } from './ChecklistDefinitionRow';

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
            <ChecklistDefinitionRow key={d.id} definition={d} departmentName={departmentNames.get(d.departmentId) ?? 'Unknown department'} />
          ))}
        </div>
      )}

      {showForm && <ChecklistDefinitionForm onClose={() => setShowForm(false)} />}
    </div>
  );
};
