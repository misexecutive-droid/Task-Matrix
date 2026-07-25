import { useState, useMemo, lazy, Suspense } from "react";
import { Plus, AlertCircle, Trash2, Pencil, Building2, Users, Loader2 } from "lucide-react";
import { Button, Skeleton } from "../../components";
import { useDeleteDepartmentMutation, useDepartmentsQuery, useUpdateDepartmentMutation, useUsersQuery } from "./hooks";
import type { Department } from "../../api/departments";

// Lazy-loaded modal chunk
const DepartmentForm = lazy(() =>
  import("./DepartmentForm").then(module => ({ default: module.DepartmentForm }))
);

export const DepartmentList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments = [], isPending, isError } = useDepartmentsQuery();
  const { data: users } = useUsersQuery();
  const updateMut = useUpdateDepartmentMutation();
  const deleteMut = useDeleteDepartmentMutation();

  // Optimized O(N) counter using useMemo
  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (users ?? []).forEach(u => {
      if (u.departmentId) {
        counts.set(u.departmentId, (counts.get(u.departmentId) ?? 0) + 1);
      }
    });
    return counts;
  }, [users]);

  const toggleActive = (id: string, isActive: boolean) => {
    updateMut.mutate({ id, payload: { isActive: !isActive } });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  // Pattern matching view renderer
  const renderContent = () => {
    if (isPending) return <DepartmentGridSkeleton />;
    if (isError) return <ErrorMessage message="Failed to load departments." />;
    if (departments.length === 0) return <EmptyState label="No departments yet — create your first one." Icon={Building2} />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(d => {
          const count = memberCounts.get(d.id) ?? 0;
          const isUpdating = updateMut.isPending && updateMut.variables?.id === d.id;
          const isDeleting = deleteMut.isPending && deleteMut.variables === d.id;

          return (
            <div
              key={d.id}
              className={`group flex flex-col justify-between p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-border-hover transition-all ${
                isDeleting ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-300 shrink-0 shadow-xs">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-display font-semibold text-text truncate" title={d.name}>
                      {d.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(d.id, d.isActive)}
                  disabled={isUpdating}
                  className={`text-[11px] font-display font-medium px-2 py-0.5 rounded-full shrink-0 cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1 ${
                    d.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-surface-hover text-text-muted hover:bg-surface-active'
                  }`}
                >
                  {isUpdating && <Loader2 size={10} className="animate-spin" />}
                  {d.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="flex items-center gap-1.5 text-xs font-display font-medium px-2.5 py-1 rounded-full bg-surface-hover text-text-secondary">
                  <Users size={12} className="shrink-0 text-text-light" />
                  {count} {count === 1 ? 'member' : 'members'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingDepartment(d)}
                    className="p-1.5 text-text-light hover:text-primary-500 hover:bg-primary-500/10 rounded-md transition-colors cursor-pointer"
                    aria-label="Edit department"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => deleteMut.mutate(d.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Delete department"
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

  const activeModal = showForm || editingDepartment;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-text">Departments</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          New department
        </Button>
      </div>

      {renderContent()}

      {activeModal && (
        <Suspense fallback={null}>
          <DepartmentForm onClose={closeForm} department={editingDepartment ?? undefined} />
        </Suspense>
      )}
    </div>
  );
};

/* Reusable Component Helpers */
const DepartmentGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col justify-between p-4 rounded-xl border border-border bg-surface gap-4 h-40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg shrink-0" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Skeleton className="h-5 w-20 rounded-full" />
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