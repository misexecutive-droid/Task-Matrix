import { Building2, UserCheck } from 'lucide-react';
import { Combobox } from '../../../components';
import { LABEL_CLASS } from './formConstants';
import type { Department } from '@/api/departments';
import type { AssignableUser } from '@/api/users';

interface DepartmentAssigneeFieldsProps {
  departmentId: string | undefined;
  onDepartmentChange: (id: string) => void;
  departments: Department[] | undefined;
  assigneeId: string | undefined;
  onAssigneeChange: (id: string) => void;
  assignableUsers: AssignableUser[] | undefined;
  locked: boolean;
}

// Locked (disabled) whenever a Category is selected, since the category already decides these.
export const DepartmentAssigneeFields = ({
  departmentId,
  onDepartmentChange,
  departments,
  assigneeId,
  onAssigneeChange,
  assignableUsers,
  locked,
}: DepartmentAssigneeFieldsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>
        <Building2 className="w-3.5 h-3.5" /> Department
      </label>
      <Combobox
        value={departmentId ?? ''}
        onChange={onDepartmentChange}
        disabled={locked}
        placeholder="Search departments..."
        emptyOptionLabel="Any department"
        options={(departments ?? []).map(d => ({ value: d.id, label: d.name }))}
      />
    </div>

    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>
        <UserCheck className="w-3.5 h-3.5" /> Assignee
      </label>
      <Combobox
        value={assigneeId ?? ''}
        onChange={onAssigneeChange}
        disabled={locked}
        placeholder="Search team members..."
        emptyOptionLabel="Unassigned"
        options={(assignableUsers ?? []).map(u => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName ?? ''}`.trim() + ` (${u.role})`,
        }))}
      />
    </div>
  </div>
);
