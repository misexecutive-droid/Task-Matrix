import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:   string;
  error?:  string;
  suffix? : React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "",suffix, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">

      <label htmlFor={id} className="text-sm font-display text-slate-700 text-navy-900">
        {label}
      </label>
       <div className="relative">
      <input
        id={id}
        ref={ref}
        className={[
          'w-full px-3 h-11 sm:h-10 text-base sm:text-sm bg-white rounded-sm border-slate-300 focus:border-2 focus:border-blue-700',
          'transition-colors duration-150',
          'placeholder:text-grey-600/40',
          'focus:outline-none focus:ring-0 focus:ring-offset-0',
          error
            ? 'border-critical focus:border-critical focus:ring-critical/20'
            : 'border-grey-200 focus:border-navy-600 focus:ring-navy-600/15',
          'disabled:bg-grey-50 disabled:text-grey-600 disabled:cursor-not-allowed',
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
        <span className="text-xs font-medium text-critical animate-fade-in">
          {error}
        </span>
      )}

    </div>
  )
);

Input.displayName = 'Input';
