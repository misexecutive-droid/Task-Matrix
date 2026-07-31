import React, { useState } from "react";
import { 
  ClipboardList, 
  Users, 
  FileDown, 
  ChevronDown,
  X
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Mocks (Replace with actual imports in production) ---
// import { useUsersQuery } from "./hook";
// import { TaskList } from "../tasks";
// import { ExportDialog } from "../reports";

const useUsersQuery = () => ({
  data: [
    { id: '1', firstName: 'Alice', lastName: 'Johnson' },
    { id: '2', firstName: 'Bob', lastName: 'Smith' },
  ]
});

const TaskList = ({ userId, hideHeader }: { userId?: string, hideHeader?: boolean }) => (
  <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 flex items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse">
    [TaskList Component: {userId ? `Filtered by ${userId}` : 'All Users'}]
  </div>
);

const ExportDialog = ({ onClose }: { reportModule: string; title: string; description: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="w-full max-w-md bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold dark:text-white">Export Tasks</h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Every task created in the selected period — status, priority, department, and assignee.</p>
      <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
        Confirm Export
      </button>
    </div>
  </div>
);

// --- Constants ---
const ALL_USERS = "__all__";

// --- Main Component ---
export const AdminTaskList = () => {
  const { data: users = [] } = useUsersQuery();
  const [userId, setUserId] = useState("");
  const [showExport, setShowExport] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          
          {/* Title Module */}
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

          {/* Action Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            
            {/* User Filter */}
            <div className="relative group/filter flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-hover/filter:text-indigo-500 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              
              <select
                value={userId || ALL_USERS}
                onChange={e => setUserId(e.target.value === ALL_USERS ? "" : e.target.value)}
                className={cn(
                  "w-full h-10 pl-9 pr-10 appearance-none transition-all cursor-pointer outline-none",
                  "text-sm font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm",
                  "text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700",
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

            {/* Export Button */}
            <button
              type="button"
              onClick={() => setShowExport(true)}
              className={cn(
                "inline-flex items-center justify-center gap-2 h-10 px-4 shrink-0",
                "text-sm font-semibold rounded-xl shadow-sm transition-all duration-300 ease-in-out",
                "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800",
                "hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                "active:scale-[0.98]"
              )}
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

          </div>
        </header>

        {/* List Content */}
        <section aria-label="Task List" className="flex flex-col flex-1">
          <TaskList userId={userId || undefined} hideHeader />
        </section>

        {/* Modal Entry */}
        {showExport && (
          <ExportDialog
            reportModule="tasks"
            title="Export Tasks"
            description="Every task created in the selected period — status, priority, department, and assignee."
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </main>
  );
};