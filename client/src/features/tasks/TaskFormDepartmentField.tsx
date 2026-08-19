import { Building2 } from 'lucide-react';
import { Combobox } from '../../components';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';
import type { Department } from '../../api/departments';

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
    <Combobox
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      disabled={disabled}
      placeholder="Search departments..."
      emptyOptionLabel="No department"
      options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
    />
  </div>
);
