import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:   string;
  error?:  string;
  suffix? : React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "",suffix, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">

      <label htmlFor={id} className="text-sm font-display font-medium text-text-secondary">
        {label}
      </label>
       <div className="relative">
      <input
        id={id}
        ref={ref}
        className={[
          'w-full px-3 h-11 sm:h-10 text-base sm:text-sm bg-surface text-text rounded-sm border',
          'transition-colors duration-150',
          'placeholder:text-text-light',
          'focus:outline-none focus:ring-4',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/15'
            : 'border-border focus:border-primary-600 focus:ring-primary-600/15',
          'disabled:bg-surface-hover disabled:text-text-muted disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}


      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex item-center">
          {suffix}
        </span>
      )}
      </div>

      {error && (
        <span className="text-xs font-medium text-danger">
          {error}
        </span>
      )}

    </div>
  )
);

Input.displayName = 'Input';
