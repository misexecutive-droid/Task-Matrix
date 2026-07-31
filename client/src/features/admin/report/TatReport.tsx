import React, { useState } from "react";
import { 
  ClipboardList, 
  Users, 
  FileDown, 
  ChevronDown,
  X,
  CheckCircle2
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const useUsersQuery = () => ({
  data: [
    { id: '1', firstName: 'Alice', lastName: 'Johnson' },
    { id: '2', firstName: 'Bob', lastName: 'Smith' },
    { id: '3', firstName: 'Charlie', lastName: 'Davis' },
  ]
});

// Mocked TaskList to ensure the file runs independently
const TaskList = ({ userId, hideHeader }: { userId?: string, hideHeader?: boolean }) => (
  <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
    <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
      <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
      {userId ? `Filtered Tasks (${userId})` : 'All Organization Tasks'}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
      This is a placeholder for the actual TaskList component. In production, your tasks will render here based on the selected filters.
    </p>
  </div>
);

const ExportDialog = ({ onClose }: { reportModule: string; title: string; description: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div 
      role="dialog"
      aria-modal="true"
      className="w-full max-w-md bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col animate-in zoom-in-95 duration-200"
    >
      <header className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
          aria-label="Close export dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </header>
      
      <footer className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/60">
        <button 
          onClick={onClose} 
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          Cancel
        </button>
        <button 
          onClick={onClose} 
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm",
            "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500",
            "transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          )}
        >
          Confirm Export
        </button>
      </footer>
    </div>
  </div>
);

const ALL_USERS = "__all__";

export const AdminTaskList = () => {
  const { data: users = [] } = useUsersQuery();
  const [userId, setUserId] = useState("");
  const [showExport, setShowExport] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Tasks
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                Track and manage every task across the organization. Filter by assignee to narrow your view.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            
            <div className="relative group/filter w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-hover/filter:text-indigo-500 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              
              <select
                value={userId || ALL_USERS}
                onChange={e => setUserId(e.target.value === ALL_USERS ? "" : e.target.value)}
                className={cn(
                  "w-full h-10 pl-10 pr-10 appearance-none transition-all cursor-pointer outline-none",
                  "text-sm font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm",
                  "text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                )}
                aria-label="Filter tasks by user"
              >
                <option value={ALL_USERS}>All users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName ?? ""}
                  </option>
                ))}
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover/filter:text-slate-600 dark:group-hover/filter:text-slate-300">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExport(true)}
              className={cn(
                "inline-flex items-center justify-center gap-2 h-10 px-5 w-full sm:w-auto shrink-0",
                "text-sm font-semibold rounded-xl shadow-sm transition-all duration-300 ease-in-out",
                "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
                "hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                "active:scale-[0.98]"
              )}
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>Export</span>
            </button>

          </div>
        </header>

        <section aria-label="Task List Content" className="flex flex-col flex-1">
          <TaskList userId={userId || undefined} hideHeader />
        </section>

        {showExport && (
          <ExportDialog
            reportModule="tasks"
            title="Export Tasks Data"
            description="Generate a CSV export containing every task created in the selected period, including status, priority, department, and assignee data."
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </main>
  );
};