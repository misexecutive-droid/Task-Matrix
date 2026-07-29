import { Users } from 'lucide-react';
import { UserMultiSelect } from '../../../../components';
import { LABEL_CLASS } from './formConstants';

interface ChecklistAssigneesFieldProps {
  departmentId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}

export const ChecklistAssigneesField = ({ departmentId, selected, onChange }: ChecklistAssigneesFieldProps) => (
  <div className="space-y-2">
    <label className={LABEL_CLASS}>
      <Users className="w-3.5 h-3.5 text-sky-400" /> Assigned Users
    </label>
    <UserMultiSelect
      departmentId={departmentId || undefined}
      selected={selected}
      onChange={onChange}
    />
  </div>
);
