import { useState, useMemo, lazy, Suspense } from 'react';
import { Plus, AlertCircle, Inbox } from 'lucide-react';
import type { AdminUser } from '../../../api/admin';
import {
  useUsersQuery,
  useDepartmentsQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../hook';
import { UserCard } from './UserCard';
import { Loader } from '../../../components';

// Lazy-loaded modal chunk
const UserForm = lazy(() =>
  import('./UserForm').then(module => ({ default: module.UserForm })).catch(() => ({
    default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 text-white p-6">Mock Form Module Loaded</div>
  }))
);

// --- Subcomponents ---
const UserGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-surface shadow-sm h-48 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-full bg-surface-hover shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/2 bg-surface-hover rounded" />
              <div className="h-3 w-3/4 bg-surface-hover rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-surface-hover rounded-full shrink-0" />
        </div>
        <div className="h-4 w-1/3 bg-surface-hover rounded-md mt-4" />
        <div className="flex items-center justify-between pt-4 border-t border-border/60 mt-auto">
          <div className="h-6 w-16 bg-surface-hover rounded-full" />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-surface-hover rounded-xl" />
            <div className="w-8 h-8 bg-surface-hover rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// --- Main Component ---
export const UserList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const { data: users = [], isPending, isError } = useUsersQuery();
  const { data: departments } = useDepartmentsQuery();
  const updateMut = useUpdateUserMutation();
  const deleteMut = useDeleteUserMutation();

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

  const renderContent = () => {
    if (isPending) return <UserGridSkeleton />;

    if (isError) return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-display font-medium">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>Failed to load users. Please check your connection and try again.</p>
      </div>
    );

    if (users.length === 0) return (
      <section className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-border bg-surface-hover/40 text-center">
        <div className="mb-5 text-text-muted">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-display font-bold text-text mb-2">No users found</h3>
        <p className="text-sm text-text-muted max-w-sm mb-8">
          You haven't added any users to your organization yet. Create your first user to get started.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="press-feedback inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-display font-bold uppercase tracking-wide rounded-xl shadow-sm bg-surface text-text-secondary border border-border transition-all duration-300 hover:bg-surface-hover hover:text-primary-600 hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Plus className="w-3.5 h-3.5" />
          Create user
        </button>
      </section>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {users.map(u => (
          <UserCard
            key={u.id}
            user={u}
            departmentName={u.departmentId ? (departmentNames.get(u.departmentId) ?? 'Unknown Dept') : undefined}
            isUpdating={updateMut.isPending && updateMut.variables?.id === u.id}
            isDeleting={deleteMut.isPending && deleteMut.variables === u.id}
            onToggleActive={toggleActive}
            onEdit={setEditingUser}
            onDelete={deleteMut.mutate}
          />
        ))}
      </div>
    );
  };

  const activeModal = showForm || editingUser;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">
          {users.length} {users.length === 1 ? 'user' : 'users'} in organization
        </p>

        <button
          onClick={() => setShowForm(true)}
          className="press-feedback group inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-display font-bold uppercase tracking-wide text-white rounded-xl shadow-sm bg-gradient-to-b from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
          New user
        </button>
      </div>

      {renderContent()}

      {activeModal && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
            <Loader size="xl" variant="primary" />
          </div>
        }>
          <UserForm onClose={closeForm} user={editingUser ?? undefined} />
        </Suspense>
      )}
    </div>
  );
};
