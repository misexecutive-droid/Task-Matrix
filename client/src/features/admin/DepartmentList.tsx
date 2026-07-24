import { useState } from "react";
import { Plus, AlertCircle, Trash2, Pencil, Building2 } from "lucide-react";
import { Button, Skeleton } from "../../components";
import { useDeleteDepartmentMutation, useDepartmentsQuery, useUpdateDepartmentMutation } from "./hooks";
import { DepartmentForm } from "./DepartmentForm";
import type { Department } from "../../api/departments";

export const DepartmentList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments = [], isPending, isError } = useDepartmentsQuery();
  const updateMut = useUpdateDepartmentMutation();
  const deleteMut = useDeleteDepartmentMutation();

  const toggleActive = (id: string, isActive: boolean) => {
    updateMut.mutate({ id, payload: { isActive: !isActive } });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
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

      {isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border bg-surface">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="size-4 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          <AlertCircle size={15} />
          Failed to load departments.
        </div>
      )}

      {!isPending && !isError && departments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
          <Building2 size={28} className="text-text-light" />
          <p className="text-sm font-display">No departments yet — create your first one.</p>
        </div>
      )}

      {!isPending && !isError && departments.length > 0 && (
        <div className="flex flex-col gap-2">
          {departments.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border bg-surface shadow-sm hover:bg-surface-hover/40 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-300 shrink-0">
                  <Building2 size={14} />
                </div>
                <p className="text-sm font-display font-medium text-text truncate">{d.name}</p>
              </div>

              <button
                onClick={() => toggleActive(d.id, d.isActive)}
                disabled={updateMut.isPending}
                className={`text-xs font-display font-medium px-2.5 py-1 rounded-full shrink-0 cursor-pointer transition-colors disabled:opacity-50 ${
                  d.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-surface-hover text-text-muted hover:bg-surface-active'
                }`}
              >
                {d.isActive ? 'Active' : 'Inactive'}
              </button>

              <button
                onClick={() => setEditingDepartment(d)}
                className="shrink-0 p-1.5 text-text-light hover:text-primary-500 hover:bg-primary-500/10 rounded-md transition-colors cursor-pointer"
                aria-label="Edit department"
              >
                <Pencil size={14} />
              </button>

              <button
                onClick={() => deleteMut.mutate(d.id)}
                disabled={deleteMut.isPending}
                className="shrink-0 p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Delete department"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(showForm || editingDepartment) && (
        <DepartmentForm onClose={closeForm} department={editingDepartment ?? undefined} />
      )}
    </div>
  );
};
