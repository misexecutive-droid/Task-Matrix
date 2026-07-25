import React from 'react';
import { Loader } from '../loaders/Loader';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 shadow-xs shadow-primary-600/20',
  secondary:
    'bg-surface-hover text-text hover:bg-border/60 active:bg-border/80 border border-border/40',
  outline:
    'border border-border/60 bg-transparent text-text-secondary hover:border-primary-500 hover:bg-primary-500/10 hover:text-text active:bg-primary-500/20',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text active:bg-border/50',
  danger:
    'bg-danger text-white hover:bg-danger/90 active:bg-danger/80 shadow-xs shadow-danger/20',
};

const sizeMap: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        'inline-flex items-center justify-center font-display font-medium tracking-tight whitespace-nowrap',
        'transition-all duration-150 ease-out cursor-pointer select-none',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <Loader
          size={size === 'lg' ? 'md' : 'sm'}
          color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'}
        />
      )}
      <span className={cn('inline-flex items-center gap-inherit', isLoading && 'opacity-90')}>
        {children}
      </span>
    </button>
  );
};