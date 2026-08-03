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
}

export const TaskFormAssigneeField = ({ value, onChange, users, isLoading }: TaskFormAssigneeFieldProps) => (
  <div className="group/field flex flex-col">
    <label className={FIELD_LABEL_CLASS}>
      <User className={FIELD_LABEL_ICON_CLASS} /> Assignee
    </label>
    <Select
      value={value || UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? '' : v)}
      disabled={isLoading}
    >
      <SelectTrigger className="h-10 text-sm font-medium bg-white border-gray-300 rounded shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full">
        <SelectValue placeholder="Assign team member" />
      </SelectTrigger>
      
      <SelectContent className="bg-white border-gray-200 shadow-lg rounded">
        <SelectItem value={UNASSIGNED} className="text-sm font-medium text-gray-500">
          Unassigned
        </SelectItem>
        
        {users?.map((u) => (
          <SelectItem key={u.id} value={u.id} className="cursor-pointer rounded-sm hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5 truncate py-0.5">
              {/* Avatar Icon */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold shrink-0 shadow-sm">
                {u.firstName?.[0]}
              </div>
              
              {/* User Name */}
              <span className="text-sm font-semibold text-gray-900 truncate">
                {u.firstName} {u.lastName ?? ''}
              </span>
              
              {/* Role Badge (Using sharp 'rounded' corners to match container) */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 shrink-0 mt-0.5">
                {u.role}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);