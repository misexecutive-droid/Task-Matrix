import { Loader2 } from 'lucide-react';
import { useAssignableUsersQuery } from './hook';

interface AssigneeMultiSelectProps {
  departmentId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}

// Picks specific users within a department — shadcn's Select is single-value only, so this is a
// small bordered checkbox-list instead. Disabled until a department is chosen since assignable
// users are scoped server-side by departmentId.
export const AssigneeMultiSelect = ({ departmentId, selected, onChange }: AssigneeMultiSelectProps) => {
  const { data: users, isLoading } = useAssignableUsersQuery(departmentId);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  if (!departmentId) {
    return (
      <div className="p-3 text-sm text-text-muted bg-surface-hover/40 border border-dashed border-border rounded-lg">
        Select a department first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto p-2 bg-surface border border-border rounded-lg">
      {isLoading && (
        <p className="flex items-center gap-2 text-xs text-text-muted px-2 py-1.5">
          <Loader2 size={13} className="animate-spin" /> Loading users…
        </p>
      )}
      {!isLoading && !users?.length && (
        <p className="text-xs text-text-muted px-2 py-1.5">No assignable users in this department.</p>
      )}
      {users?.map(u => {
        const checked = selected.includes(u.id);
        return (
          <label
            key={u.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-text cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <input
              type="checkbox"
              className="accent-primary-600 size-3.5"
              checked={checked}
              onChange={() => toggle(u.id)}
            />
            {u.firstName} {u.lastName ?? ''}
          </label>
        );
      })}
    </div>
  );
};
