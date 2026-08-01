import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Defines the dimensions and border thickness of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Dictates the color pairing for the track and the active spinning head */
  variant?: 'primary' | 'white' | 'slate' | 'rose';
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-[3px]',
};

const variantClasses = {
  primary: 'border-indigo-500/20 border-t-indigo-600 dark:border-indigo-400/20 dark:border-t-indigo-400',
  white: 'border-white/20 border-t-white',
  slate: 'border-slate-200 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-300',
  rose: 'border-rose-500/20 border-t-rose-600 dark:border-rose-400/20 dark:border-t-rose-400',
};

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ size = 'md', variant = 'primary', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Loader.displayName = 'Loader';