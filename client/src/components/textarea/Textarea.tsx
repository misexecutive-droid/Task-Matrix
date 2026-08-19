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
  labelClassName?: string;
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
      labelClassName,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID for aria-describedby if validation messages exist
    const messageId = (error || success) && id ? `${id}-message` : undefined;
    const isError = !!error;
    const isSuccess = !error && !!success;

    return (
      <div className={cn("group/field flex flex-col gap-1.5 w-full", containerClassName)}>
        {/* Label */}
        <label
          htmlFor={id}
          className={cn("flex items-center gap-1.5 text-xs font-semibold text-text-secondary transition-colors", labelClassName)}
        >
          {Icon && (
            <Icon
              className={cn("w-3.5 h-3.5 text-text-light", iconClassName)}
              strokeWidth={2.5}
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
            "w-full px-3 py-2.5 min-h-[100px] text-sm transition-all duration-200 ease-in-out resize-y",
            "bg-surface text-text placeholder:text-text-light",
            "border rounded-md outline-none appearance-none",
            "disabled:bg-surface-hover disabled:text-text-light disabled:cursor-not-allowed disabled:resize-none",
            isError
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : isSuccess
              ? "border-success focus:border-success focus:ring-2 focus:ring-success/20"
              : "border-border hover:border-border-hover focus:border-primary-400 focus:ring-2 focus:ring-coral-400/30",
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
              "flex items-center gap-1.5 text-xs font-semibold mt-0.5",
              "animate-in slide-in-from-top-1 fade-in duration-200",
              isError ? "text-danger" : "text-success"
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