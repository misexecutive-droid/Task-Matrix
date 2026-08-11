import { ChecklistAssigneesField } from '../form/ChecklistAssigneesField';
import { ChecklistRolesField } from '../form/ChecklistRolesField';
import type { ChecklistAssigneeRole } from '../../../../api/checklistDefinitions';

interface BuilderAssignPanelProps {
  storeId: string;
  assigneeIds: string[];
  onAssigneeIdsChange: (ids: string[]) => void;
  assigneeRoles: ChecklistAssigneeRole[];
  onAssigneeRolesChange: (roles: ChecklistAssigneeRole[]) => void;
}

export const BuilderAssignPanel = ({
  storeId, assigneeIds, onAssigneeIdsChange, assigneeRoles, onAssigneeRolesChange,
}: BuilderAssignPanelProps) => (
  <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-surface shadow-xs hover:shadow-sm transition-shadow duration-300">
    <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Assign To</h2>
    <div className="flex flex-col gap-4">
      <ChecklistRolesField selected={assigneeRoles} onChange={onAssigneeRolesChange} />
      
      <hr className="border-border/50" />
      
      <ChecklistAssigneesField storeId={storeId} selected={assigneeIds} onChange={onAssigneeIdsChange} />
    </div>
  </div>
);