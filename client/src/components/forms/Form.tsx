import  { type FormHTMLAttributes, type FormEventHandler } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  title?: string;
  description?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export function Form({
  children,
  title,
  description,
  onSubmit,
  className,
  ...props
}: FormProps) {
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full max-w-lg p-7 bg-surface border border-border rounded-lg shadow-sm space-y-5',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="flex flex-col gap-1.5 mb-2">
          {title && (
            <h2 className="font-display text-lg font-bold text-primary-700">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </form>
  );
}