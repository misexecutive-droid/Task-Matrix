import { forwardRef, type ReactNode, type InputHTMLAttributes } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  suffix?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
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
      labelClassName,
      ...props
    },
    ref
  ) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold text-text-secondary transition-colors",
              labelClassName
            )}
          >
            {Icon && (
              <Icon
                className={cn("w-3.5 h-3.5 text-text-light", iconClassName)}
                strokeWidth={2.5}
              />
            )}
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative group flex items-center">
          <input
            id={id}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={cn(
              "w-full h-10 rounded-md border px-3 text-sm transition-all duration-200",
              "bg-surface text-text placeholder:text-text-light",
              "focus:outline-none focus:ring-2",
              "disabled:bg-surface-hover disabled:text-text-light disabled:cursor-not-allowed",
              suffix && "pr-10",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border focus:border-primary-400 focus:ring-coral-400/30",
              className
            )}
            {...props}
          />

          {/* Suffix / Action */}
          {suffix && (
            <div className={cn(
              "absolute right-3 flex items-center justify-center transition-colors duration-200",
              "text-text-light group-focus-within:text-primary-700",
              error && "text-danger group-focus-within:text-danger"
            )}>
              {suffix}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-semibold text-danger animate-in slide-in-from-top-1 fade-in duration-200"
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