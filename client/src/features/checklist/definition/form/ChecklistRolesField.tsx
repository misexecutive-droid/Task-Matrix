import { Briefcase } from 'lucide-react';
import { LABEL_CLASS } from './formConstants';
import type { ChecklistAssigneeRole } from '../../../../api/checklistDefinitions';

export const ROLE_OPTIONS: { value: ChecklistAssigneeRole; label: string }[] = [
  { value: 'STORE_MANAGER', label: 'Store Manager' },
  { value: 'FLOOR_MANAGER', label: 'Floor Manager' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'OPERATIONS', label: 'Operations' },
];

interface ChecklistRolesFieldProps {
  selected: ChecklistAssigneeRole[];
  onChange: (roles: ChecklistAssigneeRole[]) => void;
}

// Descriptive-only "who does this job at the store" tags (shown on the Templates grid, e.g.
// "Daily · Store Manager") — separate from Assigned Users above, which is the actual mechanism
// that decides who receives each generated instance.
export const ChecklistRolesField = ({ selected, onChange }: ChecklistRolesFieldProps) => {
  const toggle = (role: ChecklistAssigneeRole) => {
    onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role]);
  };

  return (
    <div className="space-y-2">
      <label className={LABEL_CLASS}>
        <Briefcase className="w-3.5 h-3.5 text-violet-400" /> Assign To (Role)
      </label>
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map(opt => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-display font-medium cursor-pointer transition-colors',
                checked
                  ? 'border-primary-500/50 bg-primary-500/10 text-primary-700 dark:text-primary-300'
                  : 'border-border text-text-secondary hover:bg-surface-hover',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="accent-primary-600 size-3"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};
