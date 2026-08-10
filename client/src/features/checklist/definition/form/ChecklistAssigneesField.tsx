import { Users } from 'lucide-react';
import { UserMultiSelect } from '../../../../components';
import { LABEL_CLASS } from './formConstants';

interface ChecklistAssigneesFieldProps {
  storeId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}

// Scoped to the first selected store — assignment across multiple stores at once isn't modeled
// yet (see assigneeRoles for the store-job-function metadata that will eventually drive
// per-store auto-assignment instead of this explicit per-user pick).
export const ChecklistAssigneesField = ({ storeId, selected, onChange }: ChecklistAssigneesFieldProps) => (
  <div className="space-y-2">
    <label className={LABEL_CLASS}>
      <Users className="w-3.5 h-3.5 text-sky-400" /> Assigned Users
    </label>
    <UserMultiSelect
      storeId={storeId || undefined}
      selected={selected}
      onChange={onChange}
    />
  </div>
);
