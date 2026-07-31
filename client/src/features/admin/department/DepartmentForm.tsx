import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, X, AlertCircle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Input } from '../../../components';
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from '../hook';
import type { Department } from '../../../api/departments';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Schema ---
const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

type DepartmentFields = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  onClose: () => void;
  department?: Department;
}

// --- Main Component ---
export const DepartmentForm = ({ onClose, department }: DepartmentFormProps) => {
  const isEditing = !!department;
  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFields>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: department?.name || '' }
  });

  const onSubmit = (data: DepartmentFields) => {
    if (isEditing && department) {
      updateMutation.mutate({ id: department.id, payload: data }, { onSuccess: onClose });
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog" 
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <header className="relative p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900 dark:to-slate-950">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4 pr-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isEditing ? "Edit Department" : "New Department"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {isEditing 
                  ? "Update this department's name and details." 
                  : "Departments group users and scope checklist assignments."}
              </p>
            </div>
          </div>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" noValidate>
          <div className="p-6 space-y-6">
            
            {/* Input Group */}
            <Input
              id="name"
              label="Department Name"
              placeholder="e.g. Customer Support"
              autoFocus
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Mutation Error Alert */}
            {mutation.isError && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-xl animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                  {mutation.error instanceof Error ? mutation.error.message : `Failed to ${isEditing ? "update" : "create"} department. Please try again.`}
                </p>
              </div>
            )}
            
          </div>

          {/* Footer Actions */}
          <footer className="p-4 sm:p-6 pt-0 mt-auto flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={mutation.isPending}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className={cn(
                "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm",
                "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500",
                "transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                "disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
              )}
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save changes" : "Create department"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};