import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  Plus,
  AlertCircle,
  ListChecks,
  Inbox,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useChecklistTemplatesQuery, useDepartmentsQuery } from '../hook';
import { ChecklistTemplateForm } from './ChecklistTemplateForm';
import { TemplateBlock } from './TemplateBlock';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-800/80 rounded-md", className)} />
);

export const ChecklistTemplateList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: templates = [], isPending, isError } = useChecklistTemplatesQuery();
  const { data: departments = [] } = useDepartmentsQuery();
  const departmentNames = new Map(departments.map(d => [d.id, d.name]));

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm shrink-0">
              <ListChecks className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Checklist Templates
                </h1>
                <span className="flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700/50">
                  {templates.length}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Reusable steps you apply to one task or ticket at a time. Need something that repeats automatically on a schedule? Use <Link to="/admin/scheduled-checklists" className="text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2">Recurring Checklists</Link> instead.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className={cn(
              "group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm shrink-0",
              "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500",
              "transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            New Template
          </button>
        </header>

        {isPending && (
          <section aria-label="Loading templates" className="space-y-3 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </section>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Failed to load checklist templates. Please check your network connection and try again.</p>
          </div>
        )}

        {!isPending && !isError && templates.length === 0 && (
          <section
            aria-label="No templates found"
            className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center animate-in fade-in duration-500"
          >
            <div className="mb-5 text-slate-400 dark:text-slate-500">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No templates configured
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8">
              You haven't created any checklist templates yet. Standardize your team's procedures by adding your first one.
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
              Create Template
            </button>
          </section>
        )}

        {!isPending && !isError && templates.length > 0 && (
          <section aria-label="Template List" className="flex flex-col gap-3">
            {templates.map(t => (
              <TemplateBlock
                key={t.id}
                template={t}
                departmentName={t.departmentId ? (departmentNames.get(t.departmentId) ?? null) : null}
              />
            ))}
          </section>
        )}

      </div>

      {/* Creation Modal */}
      {showForm && <ChecklistTemplateForm onClose={() => setShowForm(false)} />}
    </main>
  );
};