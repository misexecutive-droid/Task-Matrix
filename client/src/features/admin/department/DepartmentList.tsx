import React, { useState, useMemo, lazy, Suspense } from "react";
import { Plus, Building2, AlertCircle, Inbox } from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Department } from "../../../api/departments";
import { DepartmentCard } from "./DepartmentCard";
import {
  useDepartmentsQuery,
  useUsersQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "../hook";

const DepartmentForm = lazy(() =>
  import("./DepartmentForm").then(module => ({ default: module.DepartmentForm })).catch(() => ({ 
    default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 text-white p-6">Mock Form Module Loaded</div> 
  }))
);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const DepartmentGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-44">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
            <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse shrink-0" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
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
    if (isPending) {
      return <DepartmentGridSkeleton />;
    }

    if (isError) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm font-medium animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load departments. Please check your connection and try again.</p>
        </div>
      );
    }

    if (departments.length === 0) {
      return (
        <section className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center animate-in fade-in duration-500">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-5 text-slate-400 dark:text-slate-500">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No departments yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8">
            Departments help you group users and scope checklist assignments. Get started by creating your first one.
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
            Create Department
          </button>
        </section>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {departments.map(d => (
          <DepartmentCard
            key={d.id}
            department={d}
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
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Departments
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {departments.length} {departments.length === 1 ? 'department' : 'departments'} configured
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
            New Department
          </button>
        </header>

        {/* Dynamic Content Rendering */}
        {renderContent()}

        {/* Modal Entry Point */}
        {activeModal && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-600 animate-spin" />
            </div>
          }>
            <DepartmentForm 
              onClose={closeForm} 
              department={editingDepartment ?? undefined} 
            />
          </Suspense>
        )}
        
      </div>
    </main>
  );
};