import type { ButtonHTMLAttributes } from 'react';
import { Loader } from '../loaders/Loader';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-700 text-white border border-transparent hover:bg-primary-800 shadow-sm focus-visible:ring-primary-500',
  secondary:
    'bg-surface text-text-secondary border border-border hover:border-border-hover hover:text-text shadow-sm focus-visible:ring-primary-500',
  outline:
    'bg-transparent text-text-secondary border border-border hover:border-border-hover hover:bg-surface-hover focus-visible:ring-primary-500',
  ghost:
    'bg-transparent text-text-muted border border-transparent hover:bg-surface-hover hover:text-text focus-visible:ring-primary-500',
  danger:
    'bg-danger text-white border border-transparent hover:bg-danger/90 shadow-sm focus-visible:ring-danger',
};

const sizeMap: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-5 text-sm gap-2 rounded-md',
  lg: 'h-11 px-6 text-base gap-2 rounded-md',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        // Base styles: Flexbox layout & typography
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        // Smooth transitions and micro-interactions
        'transition-all duration-200 ease-in-out cursor-pointer select-none',
        'active:scale-[0.98]',
        // Universal accessibility focus rings
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Rock-solid disabled states based on your color scheme
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 disabled:shadow-none',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      {...props}
    >
      {isLoading && (
        <Loader
          size={size === 'lg' ? 'md' : 'sm'}
          variant={variant === 'primary' || variant === 'danger' ? 'white' : 'slate'}
        />
      )}
      <span className={cn('inline-flex items-center gap-inherit', isLoading && 'opacity-90')}>
        {children}
      </span>
    </button>
  );
}
