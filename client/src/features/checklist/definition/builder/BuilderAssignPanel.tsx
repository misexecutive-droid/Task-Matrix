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
  <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border bg-surface">
    <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Assign To</h2>
    <ChecklistRolesField selected={assigneeRoles} onChange={onAssigneeRolesChange} />
    <ChecklistAssigneesField storeId={storeId} selected={assigneeIds} onChange={onAssigneeIdsChange} />
  </div>
);
