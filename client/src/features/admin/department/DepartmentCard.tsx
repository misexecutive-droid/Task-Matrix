import { Trash2, Pencil, Building2, Users, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Department } from '../../../api/departments';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DepartmentCardProps {
  department: Department;
  memberCount: number;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (department: Department) => void;
  onDelete: (id: string) => void;
}

export const DepartmentCard = ({
  department,
  memberCount,
  isUpdating,
  isDeleting,
  onToggleActive,
  onEdit,
  onDelete,
}: DepartmentCardProps) => {
  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between p-5 sm:p-6",
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm",
        "transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-900/50",
        isDeleting && "opacity-50 pointer-events-none grayscale-[0.3]"
      )}
    >
      {/* Header Section */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" 
              title={department.name}
            >
              {department.name}
            </h3>
          </div>
        </div>

        {/* Status Toggle */}
        <button
          type="button"
          onClick={() => onToggleActive(department.id, department.isActive)}
          disabled={isUpdating}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase shrink-0 transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
            department.isActive
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 focus-visible:ring-emerald-500"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 focus-visible:ring-slate-500",
            isUpdating && "opacity-70 cursor-not-allowed"
          )}
        >
          {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {department.isActive ? 'Active' : 'Inactive'}
        </button>
      </header>

      {/* Footer Section */}
      <footer className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
        
        {/* Members Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 text-sm font-medium border border-slate-100 dark:border-slate-800/50">
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(department)}
            className={cn(
              "p-2 rounded-xl text-slate-400 transition-all duration-200",
              "hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            )}
            aria-label={`Edit ${department.name} department`}
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(department.id)}
            disabled={isDeleting}
            className={cn(
              "p-2 rounded-xl text-slate-400 transition-all duration-200",
              "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
              isDeleting && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Delete ${department.name} department`}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </footer>
    </article>
  );
};