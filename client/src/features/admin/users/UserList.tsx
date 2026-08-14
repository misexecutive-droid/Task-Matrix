import React, { useState, useMemo, lazy, Suspense } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Users, 
  Building2, 
  Loader2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AdminUser, Role } from '../../../api/admin';
import {
  useUsersQuery,
  useDepartmentsQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../hook';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lazy-loaded modal chunk
const UserForm = lazy(() =>
  import('./UserForm').then(module => ({ default: module.UserForm })).catch(() => ({ 
    default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 text-white p-6">Mock Form Module Loaded</div> 
  }))
);

// --- Helpers ---
const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  MANAGER: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30',
  AGENT: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  USER: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  PC: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
};

const initialsOf = (firstName: string, lastName?: string | null) =>
  `${firstName[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

// --- Subcomponents ---
const UserGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-48 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0" />
        </div>
        <div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-800 rounded-md mt-4" />
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
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
      <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm font-medium animate-in fade-in duration-300">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>Failed to load users. Please check your connection and try again.</p>
      </div>
    );

    if (users.length === 0) return (
      <section className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center animate-in fade-in duration-500">
        <div className="mb-5 text-slate-400 dark:text-slate-500">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No users found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8">
          You haven't added any users to your organization yet. Create your first user to get started.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm",
            "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
            "transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          )}
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </section>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {users.map(u => {
          const isUpdating = updateMut.isPending && updateMut.variables?.id === u.id;
          const isDeleting = deleteMut.isPending && deleteMut.variables === u.id;

          return (
            <article
              key={u.id}
              className={cn(
                "group relative flex flex-col justify-between p-5",
                "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm",
                "transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-900/50",
                isDeleting && "opacity-50 pointer-events-none grayscale-[0.3]"
              )}
            >
              <div>
                <header className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900">
                      {initialsOf(u.firstName, u.lastName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {u.firstName} {u.lastName ?? ''}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={u.email}>
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleActive(u.id, u.isActive)}
                    disabled={isUpdating}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shrink-0 transition-all duration-300",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                      u.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
                      isUpdating && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </header>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 w-fit">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className={cn("truncate max-w-[150px]", !u.departmentId && "italic text-slate-400")}>
                    {u.departmentId ? (departmentNames.get(u.departmentId) ?? 'Unknown Dept') : 'No department assigned'}
                  </span>
                </div>
              </div>

              <footer className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100 dark:border-slate-800/60">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border", ROLE_STYLES[u.role])}>
                  {u.role}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingUser(u)}
                    className={cn(
                      "p-2 rounded-xl text-slate-400 transition-all duration-200",
                      "hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    )}
                    aria-label={`Edit ${u.firstName}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteMut.mutate(u.id)}
                    disabled={isDeleting}
                    className={cn(
                      "p-2 rounded-xl text-slate-400 transition-all duration-200",
                      "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                      isDeleting && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={`Delete ${u.firstName}`}
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </footer>
            </article>
          );
        })}
      </div>
    );
  };

  const activeModal = showForm || editingUser;

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Users
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {users.length} {users.length === 1 ? 'user' : 'users'} in organization
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className={cn(
              "group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm shrink-0 w-full sm:w-auto",
              "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500",
              "transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            New User
          </button>
        </header>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Lazy Modal Entry */}
        {activeModal && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-600 animate-spin" />
            </div>
          }>
            <UserForm onClose={closeForm} user={editingUser ?? undefined} />
          </Suspense>
        )}
      </div>
    </main>
  );
};