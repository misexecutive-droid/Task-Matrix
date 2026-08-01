import React from "react";
import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: React.ReactNode;
  error?: string;
  success?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      success,
      id,
      className,
      rows = 4,
      icon: Icon,
      iconClassName,
      containerClassName,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID for aria-describedby if validation messages exist
    const messageId = (error || success) && id ? `${id}-message` : undefined;
    const isError = !!error;
    const isSuccess = !error && !!success;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {/* Label */}
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-colors"
        >
          {Icon && (
            <Icon
              className={cn("w-4 h-4 text-slate-400 dark:text-slate-500", iconClassName)}
              strokeWidth={2}
            />
          )}
          {label}
        </label>

        {/* Textarea Field */}
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          aria-invalid={isError}
          aria-describedby={messageId}
          className={cn(
            "w-full px-4 py-3 min-h-[100px] text-sm font-medium transition-all duration-200 ease-in-out resize-y",
            "bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "border rounded-xl outline-none appearance-none shadow-sm",
            "disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:resize-none",
            isError
              ? "border-rose-300 dark:border-rose-700/80 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
              : isSuccess
              ? "border-emerald-300 dark:border-emerald-700/80 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20",
            className
          )}
          {...props}
        />

        {/* Validation Messages */}
        {(isError || isSuccess) && (
          <p
            id={messageId}
            role="alert"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium mt-0.5",
              "animate-in slide-in-from-top-1 fade-in duration-200",
              isError ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
            )}
          >
            {isError ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            )}
            {error || success}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";