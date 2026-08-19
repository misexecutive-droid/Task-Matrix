import { useState, useMemo, lazy, Suspense } from "react";
import { Plus, AlertCircle, Inbox } from "lucide-react";

import type { Department } from "../../../api/departments";
import { DepartmentCard } from "./DepartmentCard";
import {
  useDepartmentsQuery,
  useUsersQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "../hook";
import { useStoresQuery } from "../../tickets/hook";
import { Loader } from "../../../components";

const DepartmentForm = lazy(() =>
  import("./DepartmentForm").then(module => ({ default: module.DepartmentForm })).catch(() => ({
    default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 text-white p-6">Mock Form Module Loaded</div>
  }))
);

const DepartmentGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-border bg-surface shadow-sm h-44 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-surface-hover shrink-0" />
            <div className="h-5 w-3/4 bg-surface-hover rounded" />
          </div>
          <div className="h-6 w-16 bg-surface-hover rounded-full shrink-0" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border/60 mt-auto">
          <div className="h-6 w-24 bg-surface-hover rounded-lg" />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-surface-hover rounded-xl" />
            <div className="w-8 h-8 bg-surface-hover rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);


export const DepartmentList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments = [], isPending, isError } = useDepartmentsQuery();
  const { data: users } = useUsersQuery();
  const { data: stores } = useStoresQuery();
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

  const storeNameById = useMemo(() => {
    const names = new Map<string, string>();
    (stores ?? []).forEach(s => names.set(s.id, s.name));
    return names;
  }, [stores]);

  const toggleActive = (id: string, isActive: boolean) => {
    updateMut.mutate({ id, payload: { isActive: !isActive } });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  // Pattern matching view renderer
  const renderContent = () => {
    if (isPending) {
      return <DepartmentGridSkeleton />;
    }

    if (isError) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-display font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load departments. Please check your connection and try again.</p>
        </div>
      );
    }

    if (departments.length === 0) {
      return (
        <section className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-border bg-surface-hover/40 text-center">
          <div className="mb-5 text-text-muted">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-text mb-2">
            No departments yet
          </h3>
          <p className="text-sm text-text-muted max-w-sm mb-8">
            Departments help you group users and scope checklist assignments. Get started by creating your first one.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="press-feedback inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-display font-bold uppercase tracking-wide rounded-xl shadow-sm bg-surface text-text-secondary border border-border transition-all duration-300 hover:bg-surface-hover hover:text-primary-600 hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Plus className="w-3.5 h-3.5" />
            Create department
          </button>
        </section>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {departments.map(d => (
          <DepartmentCard
            key={d.id}
            department={d}
            storeName={d.storeId ? storeNameById.get(d.storeId) : undefined}
            memberCount={memberCounts.get(d.id) ?? 0}
            isUpdating={updateMut.isPending && updateMut.variables?.id === d.id}
            isDeleting={deleteMut.isPending && deleteMut.variables === d.id}
            onToggleActive={toggleActive}
            onEdit={setEditingDepartment}
            onDelete={deleteMut.mutate}
          />
        ))}
      </div>
    );
  };

  const activeModal = showForm || editingDepartment;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-text-muted">
          {departments.length} {departments.length === 1 ? 'department' : 'departments'} configured
        </p>

        <button
          onClick={() => setShowForm(true)}
          className="press-feedback group inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-display font-bold uppercase tracking-wide text-white rounded-xl shadow-sm bg-gradient-to-b from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90" />
          New department
        </button>
      </div>

      {renderContent()}

      {activeModal && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
            <Loader size="xl" variant="primary" />
          </div>
        }>
          <DepartmentForm
            onClose={closeForm}
            department={editingDepartment ?? undefined}
          />
        </Suspense>
      )}
    </div>
  );
};
