import { Building2, Layers } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';
import type { Department } from '../../api/departments';

const NO_DEPARTMENT = '__none__';

interface TaskFormDepartmentFieldProps {
  value: string;
  onChange: (value: string) => void;
  departments?: Department[];
  isLoading: boolean;
}

export const TaskFormDepartmentField = ({ value, onChange, departments, isLoading }: TaskFormDepartmentFieldProps) => (
  <div className="group/field flex flex-col justify-end">
    <label className={FIELD_LABEL_CLASS}>
      <Building2 className={FIELD_LABEL_ICON_CLASS} /> Department
    </label>
    <Select
      value={value || NO_DEPARTMENT}
      onValueChange={(v) => onChange(v === NO_DEPARTMENT ? '' : v)}
      disabled={isLoading}
    >
      <SelectTrigger className="h-10 text-sm font-medium bg-white border-gray-300 rounded shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full">
        <SelectValue placeholder="Select Department" />
      </SelectTrigger>
      
      <SelectContent className="bg-white border-gray-200 shadow-lg rounded">
        <SelectItem value={NO_DEPARTMENT} className="text-sm font-medium text-gray-500">
          No Department
        </SelectItem>
        
        {departments?.map((d) => (
          <SelectItem key={d.id} value={d.id} className="text-sm font-medium text-gray-900 cursor-pointer rounded-sm hover:bg-gray-50 transition-colors">
            <span className="flex items-center gap-2 truncate">
              <Layers className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{d.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);