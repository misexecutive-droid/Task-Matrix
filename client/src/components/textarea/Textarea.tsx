import React from "react";
import type { LucideIcon } from "lucide-react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label:          React.ReactNode;
  error?:         string;
  success?:       string;
  icon?:          LucideIcon;
  iconClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, success, id, className = "", rows = 4, icon: Icon, iconClassName = "text-text-muted", ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-display font-medium text-text-secondary">
        {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClassName}`} />}
        {label}
      </label>

      <textarea
        id={id}
        ref={ref}
        rows={rows}
        className={[
          'w-full px-3 py-2.5 text-base sm:text-sm bg-surface text-text rounded-none border resize-y',
          'transition-colors duration-300',
          'placeholder:text-text-light',
          'focus:outline-none focus:ring-4',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/15'
            : success
            ? 'border-success focus:border-success focus:ring-success/15'
            : 'border-border focus:border-primary-600 focus:ring-primary-600/15',
          'disabled:bg-surface-hover disabled:text-text-muted disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />

      {error && <span className="text-xs font-medium text-danger">{error}</span>}
      {!error && success && <span className="text-xs font-medium text-success">{success}</span>}
    </div>
  )
);

Textarea.displayName = 'Textarea';
