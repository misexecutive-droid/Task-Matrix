import React, { useState } from "react";
import {
  ClipboardList,
  Users,
  FileDown,
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUsersQuery } from "../hook";
import { TaskList } from "../../tasks";
import { ExportDialog } from "../../reports";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ALL_USERS = "__all__";

export const TatReport = () => {
  const { data: users = [] } = useUsersQuery();
  const [userId, setUserId] = useState("");
  const [showExport, setShowExport] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
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

            <Select value={userId || ALL_USERS} onValueChange={v => setUserId(v === ALL_USERS ? "" : v)}>
              <SelectTrigger className="w-full sm:w-56 h-10 text-sm" aria-label="Filter tasks by user">
                <Users className="w-4 h-4 shrink-0 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS}>All users</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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