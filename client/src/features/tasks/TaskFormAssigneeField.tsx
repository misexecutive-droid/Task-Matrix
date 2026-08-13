import { User } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';
import type { AssignableUser } from '../../api/users';

const UNASSIGNED = '__unassigned__';

interface TaskFormAssigneeFieldProps {
  value: string;
  onChange: (value: string) => void;
  users?: AssignableUser[];
  isLoading: boolean;
  disabled?: boolean;
}

export const TaskFormAssigneeField = ({ value, onChange, users, isLoading, disabled = false }: TaskFormAssigneeFieldProps) => (
  <div className="group/field flex flex-col">
    <label className={FIELD_LABEL_CLASS}>
      <User className={FIELD_LABEL_ICON_CLASS} /> Assignee
    </label>
    <Select
      value={value || UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? '' : v)}
      disabled={isLoading || disabled}
    >
      <SelectTrigger className="h-10 text-sm font-medium bg-surface border-border rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-full">
        <SelectValue placeholder="Assign team member" />
      </SelectTrigger>

      <SelectContent className="bg-surface border-border shadow-lg rounded">
        <SelectItem value={UNASSIGNED} className="text-sm font-medium text-text-muted">
          Unassigned
        </SelectItem>

        {users?.map((u) => (
          <SelectItem key={u.id} value={u.id} className="cursor-pointer rounded-sm hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-2.5 truncate py-0.5">
              {/* Avatar Icon */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-[10px] font-bold shrink-0 shadow-sm">
                {u.firstName?.[0]}
              </div>

              {/* User Name */}
              <span className="text-sm font-semibold text-text truncate">
                {u.firstName} {u.lastName ?? ''}
              </span>

              {/* Role Badge (Using sharp 'rounded' corners to match container) */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1.5 py-0.5 rounded bg-surface-hover border border-border shrink-0 mt-0.5">
                {u.role}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);