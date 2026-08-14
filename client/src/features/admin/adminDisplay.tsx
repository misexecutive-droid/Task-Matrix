import React, { type ElementType } from 'react';
import { AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
 
// --- Error Message Component ---

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className }: ErrorMessageProps) => (
  <div 
    role="alert"
    className={cn(
      "flex items-start gap-3 p-4 rounded-xl",
      "bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50",
      "text-rose-700 dark:text-rose-400 text-sm font-medium",
      "animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out",
      className
    )}
  >
    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
    <p className="leading-relaxed">{message}</p>
  </div>
);

// --- Empty State Component ---

interface EmptyStateProps {
  label: string;
  description?: string;
  Icon: ElementType;
  className?: string;
}

export const EmptyState = ({ label, description, Icon, className }: EmptyStateProps) => (
  <section 
    aria-label={label}
    className={cn(
      "flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center",
      "rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800",
      "bg-slate-50/50 dark:bg-slate-900/20",
      "animate-in fade-in duration-500",
      className
    )}
  >
    <div className="mb-4 text-slate-400 dark:text-slate-500">
      <Icon className="w-8 h-8" strokeWidth={1.5} />
    </div>
    
    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
      {label}
    </h3>
    
    {description && (
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed">
        {description}
      </p>
    )}
  </section>
);