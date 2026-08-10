import { Loader2 } from 'lucide-react';
import { useAssignableUsersQuery } from '../../features/tickets/hook';

interface UserMultiSelectProps {
  departmentId?: string;
  storeId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}

// Picks specific users within a department and/or store — shadcn's Select is single-value only,
// so this is a small bordered checkbox-list instead. Disabled until a scope is chosen since
// assignable users are scoped server-side by departmentId/storeId.
export const UserMultiSelect = ({ departmentId, storeId, selected, onChange }: UserMultiSelectProps) => {
  const { data: users, isLoading } = useAssignableUsersQuery(departmentId, storeId);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  if (!departmentId && !storeId) {
    return (
      <div className="p-3 text-sm font-display text-text-muted bg-surface-hover/40 border border-dashed border-border rounded-lg">
        Select a department or store first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-2.5 bg-surface border border-border rounded-lg">
      {isLoading && (
        <p className="flex items-center gap-2 text-xs font-display text-text-muted px-2 py-2">
          <Loader2 size={13} className="animate-spin" /> Loading users…
        </p>
      )}
      {!isLoading && !users?.length && (
        <p className="text-xs font-display text-text-muted px-2 py-2">No assignable users in this scope.</p>
      )}
      {users?.map(u => {
        const checked = selected.includes(u.id);
        return (
          <label
            key={u.id}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm font-display text-text cursor-pointer hover:bg-surface-hover transition-colors"
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
