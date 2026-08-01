import React from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  suffix?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      id,
      className,
      suffix,
      icon: Icon,
      iconClassName,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {/* Label - Updated to match image (standard case, medium font, slate-800) */}
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors"
        >
          {Icon && (
            <Icon 
              className={cn("w-4 h-4 text-slate-400 dark:text-slate-500", iconClassName)} 
              strokeWidth={2}
            />
          )}
          {label}
        </label>

        {/* Input Container */}
        <div className="relative group flex items-center">
          <input
            id={id}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={cn(
              "w-full h-11 px-4 text-sm transition-all duration-200 ease-in-out",
              // Updated text color to match the lighter grayish-blue input values in the image
              "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 placeholder:text-slate-400",
              "border rounded-lg outline-none appearance-none",
              "disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 disabled:cursor-not-allowed",
              suffix && "pr-11",
              error
                ? "border-rose-300 dark:border-rose-700/80 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20",
              className
            )}
            {...props}
          />
          
          {/* Suffix / Action */}
          {suffix && (
            <div className={cn(
              "absolute right-3 flex items-center justify-center transition-colors duration-200",
              "text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300",
              error && "text-rose-400 group-focus-within:text-rose-500"
            )}>
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-rose-500 dark:text-rose-400 animate-in slide-in-from-top-1 fade-in duration-200"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";