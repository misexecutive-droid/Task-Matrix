import { Building2, UserCheck } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LABEL_CLASS, SELECT_CLASS_DISABLED, ANY_DEPARTMENT, UNASSIGNED } from './formConstants';
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
      <Select
        value={departmentId || ANY_DEPARTMENT}
        onValueChange={v => onDepartmentChange(v === ANY_DEPARTMENT ? '' : v)}
        disabled={locked}
      >
        <SelectTrigger className={SELECT_CLASS_DISABLED}>
          <SelectValue placeholder="Any department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_DEPARTMENT} className="font-display text-xs">Any department</SelectItem>
          {departments?.map(d => (
            <SelectItem key={d.id} value={d.id} className="font-display text-xs">{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>
        <UserCheck className="w-3.5 h-3.5" /> Assignee
      </label>
      <Select
        value={assigneeId || UNASSIGNED}
        onValueChange={v => onAssigneeChange(v === UNASSIGNED ? '' : v)}
        disabled={locked}
      >
        <SelectTrigger className={SELECT_CLASS_DISABLED}>
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED} className="font-display text-xs">Unassigned</SelectItem>
          {assignableUsers?.map(u => (
            <SelectItem key={u.id} value={u.id} className="font-display text-xs">
              {u.firstName} {u.lastName ?? ''} ({u.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);
