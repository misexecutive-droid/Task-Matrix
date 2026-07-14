import { useState } from "react";
import { Plus, Loader2, AlertCircle, Trash2, Pencil } from "lucide-react";
import { Button } from "../../components";
import { useDeleteDepartmentMutation, useDepartmentsQuery, useUpdateDepartmentMutation } from "./hooks";
import { DepartmentForm } from "./DepartmentForm";
import type { Department } from "../../api/departments";

export const DepartmentList = () => {
    const [showForm, setShowForm] = useState(false)
    const [editingDepartment, setEditngDepartment] = useState<Department | null>(null)

    const { data: departments = [], isPending, isError } = useDepartmentsQuery();
    const updateMut = useUpdateDepartmentMutation();
    const deleteMut = useDeleteDepartmentMutation();

    const toggleActive = (id: string, isActive: boolean) => {
        updateMut.mutate({ id, payload: { isActive: !isActive } })
    };

    const closeForm = () => {
        setShowForm(false)
        setEditngDepartment(null)
    }

    return (
        <>
            <div className="flex flex-col gap-6 max-w-3xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-display font-semibold text-text">
                            Departments
                        </h1>
                        <p className="text-sm text-text-muted mt-0.5">
                            {
                                departments.length
                            } department {departments.length !== 1 ? "s" : ""}

                        </p>
                    </div>
                    <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowForm(true)}>
                        <Plus size={14} />
                        New department
                    </Button>
                </div>

                {
                    isPending && (
                        <div className="flex items-center justify-center gap-2 py-16 text-text-muted">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm font-display">Loading departments</span>
                        </div>
                    )
                }

                {
                    isError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
                            <AlertCircle size={15} />
                            Failed to load departments.
                        </div>
                    )
                }

                {
                    !isPending && !isError && departments.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
                            <p className="text-sm font-display">
                                No departments yet -- create your first one.
                            </p>
                        </div>
                    )
                }

                {
                    !isPending && !isError && departments.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {
                                departments.map(d => (
                                    <div key={d.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border bg-surface">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-display font-medium text-text truncate">
                                                {d.name}
                                            </p>
                                        </div>

                                        <Button
                                            onClick={() => toggleActive(d.id, d.isActive)}
                                            className={`text-xs font-display font-medium px-2.5 py-1 rounded-full shrink-0 cursor-pointer ${d.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-surface-hover text-text-muted'}`}
                                        >
                                            {d.isActive ? "Active" : "Inactive"}

                                        </Button>

                                        <Button
                                            onClick={() => setEditngDepartment(d)}
                                            className="shrink-0 text-text-light hover:text-text-secondary transition-colors cursor-pointer"
                                            aria-label="Edit department"
                                        >
                                            <Pencil size={14} />

                                        </Button>

                                        <Button
                                            onClick={() => deleteMut.mutate(d.id)}
                                            disabled={deleteMut.isPending}
                                            className="shrink-0 text-text-light hover:text-danger transition-colors cursor-pointer disabled:opacity-50"
                                            aria-label="Delete department"
                                        >
                                            <Trash2 size={14} />

                                        </Button>

                                    </div>
                                ))
                            }
                        </div>
                    )

                }

                {(showForm || editingDepartment) && (<DepartmentForm onClose={closeForm} department={editingDepartment ?? undefined} />)}

            </div>

        </>
    )
}