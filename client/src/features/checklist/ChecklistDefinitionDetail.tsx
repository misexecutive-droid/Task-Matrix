import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, Repeat, Users, Calendar } from 'lucide-react';
import { Skeleton } from '../../components';
import { useChecklistDefinitionQuery, useInstancesForDefinitionQuery, useDepartmentsQuery } from './hook';
import { ChecklistInstanceRow } from './ChecklistInstanceRow';
import { formatDate } from './checklistDisplay';

export const ChecklistDefinitionDetail = () => {
  const { definitionId = '' } = useParams();
  const navigate = useNavigate();
  const { data: definition, isPending, isError } = useChecklistDefinitionQuery(definitionId);
  const { data: instances = [] } = useInstancesForDefinitionQuery(definitionId);
  const { data: departments = [] } = useDepartmentsQuery();

  const departmentName = definition
    ? departments.find(d => d.id === definition.departmentId)?.name ?? 'Unknown department'
    : '';

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !definition) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono max-w-3xl">
        <AlertCircle size={15} />
        Failed to load checklist.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <button
        onClick={() => navigate('/admin/scheduled-checklists')}
        className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft size={13} /> Back to Recurring Checklists
      </button>

      <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-600 shrink-0">
            <Repeat size={18} />
          </div>
          <div>
            <h1 className="text-lg font-mono font-semibold text-text">{definition.name}</h1>
            {definition.description && (
              <p className="text-sm text-text-muted mt-0.5">{definition.description}</p>
            )}
          </div>
          {!definition.isActive && (
            <span className="ml-auto text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border shrink-0">
              Paused
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs font-mono text-text-muted pt-3 border-t border-border/50">
          <span>{departmentName}</span>
          <span className="flex items-center gap-1"><Users size={12} /> {definition.assigneeIds.length} assigned</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> Starts {formatDate(definition.startDate)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-mono font-semibold text-text-muted uppercase tracking-wider">
          Generated Instances ({instances.length})
        </h2>
        {instances.length === 0 && (
          <div className="p-6 text-center text-sm text-text-muted bg-surface rounded-lg border border-dashed border-border font-mono">
            No instances generated yet.
          </div>
        )}
        {instances.map(instance => <ChecklistInstanceRow key={instance.id} instance={instance} />)}
      </div>
    </div>
  );
};
