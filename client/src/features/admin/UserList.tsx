import { useState, useMemo, lazy, Suspense } from 'react';
import { Plus, AlertCircle, Trash2, Pencil, Users, Building2, Loader2 } from 'lucide-react';
import { Button, Skeleton } from '../../components';
import { useUsersQuery, useDeleteUserMutation, useUpdateUserMutation, useDepartmentsQuery } from './hooks';
import type { Role, AdminUser } from '../../api/admin';

// Code-split modal form for performance optimization
const UserForm = lazy(() =>
  import('./UserForm').then(module => ({ default: module.UserForm }))
);

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-danger/10 text-danger border-danger/20',
  MANAGER: 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/20',
  AGENT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  USER: 'bg-surface-hover text-text-secondary border-border',
  PC: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const initialsOf = (firstName: string, lastName?: string | null) =>
  `${firstName[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

export const UserList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const { data: users = [], isPending, isError } = useUsersQuery();
  const { data: departments } = useDepartmentsQuery();
  const updateMut = useUpdateUserMutation();
  const deleteMut = useDeleteUserMutation();

  // Memoize department map lookup to prevent O(N) recalculations on render
  const departmentNames = useMemo(
    () => new Map((departments ?? []).map(d => [d.id, d.name])),
    [departments]
  );

  const toggleActive = (id: string, isActive: boolean) => {
    updateMut.mutate({ id, payload: { isActive: !isActive } });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  // Declarative UI state mapping — zero if/else branches
  const renderContent = () => {
    if (isPending) return <UserGridSkeleton />;
    if (isError) return <ErrorMessage message="Failed to load users." />;
    if (users.length === 0) return <EmptyState label="No users yet — create your first one." Icon={Users} />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const isUpdating = updateMut.isPending && updateMut.variables?.id === u.id;
          const isDeleting = deleteMut.isPending && deleteMut.variables === u.id;

          return (
            <div
              key={u.id}
              className={`group flex flex-col justify-between p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-border-hover transition-all ${
                isDeleting ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-display font-semibold text-sm shrink-0 shadow-sm">
                      {initialsOf(u.firstName, u.lastName)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-semibold text-text truncate">
                        {u.firstName} {u.lastName ?? ''}
                      </p>
                      <p className="text-xs text-text-muted font-display truncate" title={u.email}>
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleActive(u.id, u.isActive)}
                    disabled={isUpdating}
                    className={`text-[11px] font-display font-medium px-2 py-0.5 rounded-full shrink-0 cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1 ${
                      u.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-surface-hover text-text-muted hover:bg-surface-active'
                    }`}
                  >
                    {isUpdating && <Loader2 size={10} className="animate-spin" />}
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-display text-text-muted mt-2">
                  <Building2 size={13} className="shrink-0 text-text-light" />
                  <span className={u.departmentId ? 'truncate' : 'italic text-text-light'}>
                    {u.departmentId ? (departmentNames.get(u.departmentId) ?? 'Unknown') : 'No department'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/60">
                <span className={`text-[11px] font-display font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_STYLES[u.role]}`}>
                  {u.role}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="p-1.5 text-text-light hover:text-primary-500 hover:bg-primary-500/10 rounded-md transition-colors cursor-pointer"
                    aria-label="Edit user"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => deleteMut.mutate(u.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Delete user"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin text-danger" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const activeModal = showForm || editingUser;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-text">Users</h1>
            <p className="text-sm text-text-muted mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          New user
        </Button>
      </div>

      {renderContent()}

      {activeModal && (
        <Suspense fallback={null}>
          <UserForm onClose={closeForm} user={editingUser ?? undefined} />
        </Suspense>
      )}
    </div>
  );
};

/* Reusable Declarative UI Helpers */
const UserGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col justify-between p-4 rounded-xl border border-border bg-surface gap-4 h-48">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
    <AlertCircle size={15} />
    {message}
  </div>
);

const EmptyState = ({ label, Icon }: { label: string; Icon: React.ElementType }) => (
  <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2 border border-dashed border-border rounded-xl bg-surface/50">
    <Icon size={28} className="text-text-light" />
    <p className="text-sm font-display">{label}</p>
  </div>
);