import { useState } from "react";
import { Plus, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "../../components";
import { useDepartmentsQuery, useDelereDepartmentMutation, useUpdateDepartmentMutaion } from "./hooks";
import { DepartmentForm } from "./DepartmentForm";

export const DepartmentList = () => {
    const [showForm, setShowForm] = useState(false)

    const { data: departments = [], isPending, isError } = useDepartmentsQuery();
    const updateMut = useUpdateDepartmentMutaion();
    const deleteMut = useDelereDepartmentMutation();

    const toggleActive = (id: string, isActive: boolean) => {
        updateMut.mutate({ id, payload: { isActive: !isActive } })
    };

    return (
        <>
            <div className="flex flex-col gap-6 max-w-3xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-display font-semibold text-slate-900">
                            Departmetns
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">
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
                        <div className="flex items-center justify-center py-16 text-slate-400">
                            <Loader2 className="text-sm font-display"/>

                            <span className="text-sm font-display">Loading departments</span>
                        </div>
                    )
                }

                {
                    isError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500 text-sm font-display">
                            <AlertCircle size={15} />
                            Failed to load departments.

                        </div>
                    )
                }

                {
                    !isPending && !isError && departments.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
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
                                    <div key={d.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-slate-200/70 bg-white">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-display font-medium text-slate-800 truncate">
                                                {d.name}
                                            </p>
                                        </div>

                                        <Button
                                            onClick={() => toggleActive(d.id, d.isActive)}
                                            className={`text-xs font-display font-medium px-2.5 py-1 rounded-full shrink-0 cursor-pointer ${d.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {d.isActive ? "Active" : "Inactive"}

                                        </Button>

                                        <Button
                                            onClick={() => deleteMut.mutate(d.id)}
                                            disabled={deleteMut.isPending}
                                            className="shrink-0 text-slate-300 hover:text-red-400 transition-color cursor-pointer disabled:opacity-50"
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

                {showForm && <DepartmentForm onClose={() => setShowForm(false)} />}

            </div>

        </>
    )
}