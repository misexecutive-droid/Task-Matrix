import { Link } from 'react-router';
import { Repeat, Users, Pause, Play, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { useDeleteChecklistDefinitionMutation, useSetChecklistDefinitionActiveMutation } from './hook';
import { RECURRENCE_LABEL } from './checklistDisplay';
import type { ChecklistDefinition } from '../../api/checklistDefinitions';

interface ChecklistDefinitionRowProps {
  definition: ChecklistDefinition;
  departmentName: string;
}

// One row in ChecklistDefinitionList's list of recurring checklists.
export const ChecklistDefinitionRow = ({ definition, departmentName }: ChecklistDefinitionRowProps) => {
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
