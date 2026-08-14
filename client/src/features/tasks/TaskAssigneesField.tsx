import { useState } from 'react';
import { Plus, Users, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { avatarColorClass } from './avatarColors';
import { getInitials } from '../../lib/getInitials';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';
import { useAuth } from '../../context/AuthContext';
import { UserForm } from '../admin/users/UserForm';
import type { AssignableUser } from '../../api/users';

interface TaskAssigneesFieldProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  users?: AssignableUser[];
  isLoading?: boolean;
  disabled?: boolean;
}

// Shows only the currently-assigned people as solid avatars, plus a dashed "+" trigger that
// opens a checklist of everyone else — instead of always showing every assignable user inline.
// The caller (TaskForm/TaskDetail) is responsible for splitting the result back into assigneeId
// (primary) + additionalAssigneeIds (extras) before saving.
export const TaskAssigneesField = ({ selectedIds, onChange, users, isLoading = false, disabled = false }: TaskAssigneesFieldProps) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const nameOf = (u: AssignableUser) => `${u.firstName} ${u.lastName ?? ''}`.trim();
  const selectedUsers = (users ?? []).filter((u) => selectedIds.includes(u.id));

  return (
    <div className="group/field flex flex-col gap-1.5">
      <label className={FIELD_LABEL_CLASS}>
        <Users className={FIELD_LABEL_ICON_CLASS} /> Assignees
      </label>
      <div className="flex flex-wrap items-center gap-1.5 min-h-10">
        {selectedUsers.map((u) => {
          const name = nameOf(u);
          return (
            <button
              key={u.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(u.id)}
              title={`${name} — click to remove`}
              className={`flex items-center justify-center size-8 rounded-full text-[11px] font-bold text-white shrink-0 cursor-pointer transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 ${avatarColorClass(name)}`}
            >
              {getInitials(name)}
            </button>
          );
        })}

        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Add assignee"
                aria-label="Add assignee"
                className="flex items-center justify-center size-8 rounded-full border border-dashed border-border-hover text-text-light hover:text-primary-600 hover:border-primary-400 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {isLoading ? (
                <div className="px-2 py-1.5 text-xs text-text-light">Loading team…</div>
              ) : (users ?? []).length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-text-light">No assignable users</div>
              ) : (
                (users ?? []).map((u) => {
                  const name = nameOf(u);
                  const checked = selectedIds.includes(u.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={u.id}
                      checked={checked}
                      onCheckedChange={() => toggle(u.id)}
                      onSelect={(e) => e.preventDefault()}
                      className="gap-2"
                    >
                      <span className={`flex items-center justify-center size-5 rounded-full text-[9px] font-bold text-white shrink-0 ${avatarColorClass(name)}`}>
                        {getInitials(name)}
                      </span>
                      {name}
                    </DropdownMenuCheckboxItem>
                  );
                })
              )}

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setIsCreatingUser(true)}
                    className="gap-2 text-primary-600 dark:text-primary-400"
                  >
                    <UserPlus size={14} />
                    Create new user
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {selectedUsers.length === 0 && (
          <span className="text-xs text-text-light">Unassigned</span>
        )}
      </div>

      {isCreatingUser && (
        <UserForm
          onClose={() => setIsCreatingUser(false)}
          onCreated={(created) => onChange([...selectedIds, created.id])}
        />
      )}
    </div>
  );
};
