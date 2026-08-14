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
  disabled?: boolean;
}

export const TaskFormDepartmentField = ({ value, onChange, departments, isLoading, disabled = false }: TaskFormDepartmentFieldProps) => (
  <div className="group/field flex flex-col justify-end">
    <label className={FIELD_LABEL_CLASS}>
      <Building2 className={FIELD_LABEL_ICON_CLASS} /> Department
    </label>
    <Select
      value={value || NO_DEPARTMENT}
      onValueChange={(v) => onChange(v === NO_DEPARTMENT ? '' : v)}
      disabled={isLoading || disabled}
    >
      <SelectTrigger className="h-10 text-sm font-medium bg-surface  rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-full">
        <SelectValue placeholder="Select Department" />
      </SelectTrigger>

      <SelectContent className="bg-surface border-border shadow-lg rounded">
        <SelectItem value={NO_DEPARTMENT} className="text-sm font-medium text-text-muted">
          No Department
        </SelectItem>

        {departments?.map((d) => (
          <SelectItem key={d.id} value={d.id} className="text-sm font-medium text-text cursor-pointer rounded-sm hover:bg-surface-hover transition-colors">
            <span className="flex items-center gap-2 truncate">
              <Layers className="w-4 h-4 text-text-light shrink-0" />
              <span className="truncate">{d.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);