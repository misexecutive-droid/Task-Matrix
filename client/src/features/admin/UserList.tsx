import { useState } from 'react';
import { Plus, AlertCircle, Trash2 } from 'lucide-react';
import { Button, Skeleton } from '../../components';
import { useUsersQuery, useDeleteUserMutation, useUpdateUserMutation } from './hooks';
import { UserForm } from './UserForm';
import type { Role } from '../../api/admin';

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-red-50     text-red-600',
  MANAGER: 'bg-indigo-50  text-indigo-600',
  AGENT: 'bg-amber-50   text-amber-600',
  USER: 'bg-slate-100  text-slate-600',
};

export const UserList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: users = [], isPending, isError } = useUsersQuery();
  const updateMut = useUpdateUserMutation();
  const deleteMut = useDeleteUserMutation();

  const toggleActive = (id: string, isActive: boolean) => {
    updateMut.mutate({ id, payload: { isActive: !isActive } });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          New user
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex item-center jutify-between gap-4 px-4 py-3 rounded-lg border border-border bg-surface">
              <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
                <Skeleton className="h-4 w-40" />
                <Skeleton className='h-3 w-28' />

              </div>

              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-500 text-sm font-display">
          <AlertCircle size={15} />
          Failed to load users.
        </div>
      )}

      {!isPending && !isError && (
        <div className="flex flex-col gap-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-slate-200/70 bg-white">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-medium text-slate-800 truncate">{u.firstName} {u.lastName ?? ''}</p>
                <p className="text-xs text-slate-400 font-display truncate">{u.email}</p>
              </div>

              <span className={`text-xs font-display font-medium px-2.5 py-1 rounded-full shrink-0 ${ROLE_STYLES[u.role]}`}>
                {u.role}
              </span>

              <button
                onClick={() => toggleActive(u.id, u.isActive)}
                className={`text-xs font-display font-medium px-2.5 py-1 rounded-full shrink-0 cursor-pointer ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
              >
                {u.isActive ? 'Active' : 'Inactive'}
              </button>

              <button
                onClick={() => deleteMut.mutate(u.id)}
                disabled={deleteMut.isPending}
                className="shrink-0 text-slate-300 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Delete user"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
    </div>
  );
};