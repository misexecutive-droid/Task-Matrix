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
    'bg-blue-600 text-white border border-transparent hover:bg-blue-700 active:bg-blue-800 shadow-sm focus-visible:ring-blue-500',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 shadow-sm focus-visible:ring-gray-500',
  outline:
    'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500',
  ghost:
    'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-500',
  danger:
    'bg-red-600 text-white border border-transparent hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-500',
};

const sizeMap: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded',
  md: 'h-9 px-4 text-sm gap-2 rounded',
  lg: 'h-11 px-6 text-base gap-2 rounded',
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
        // Base styles: Flexbox layout & typography
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        // Smooth transitions and micro-interactions
        'transition-all duration-200 ease-in-out cursor-pointer select-none',
        'active:scale-[0.98]',
        // Universal accessibility focus rings (color is overridden by variantMap)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Rock-solid disabled states
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 disabled:shadow-none',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <Loader
          size={size === 'lg' ? 'md' : 'sm'}
          // Passed standard default colors to your loader based on the button background
          color={variant === 'primary' || variant === 'danger' ? 'white' : 'blue'}
        />
      )}
      <span className={cn('inline-flex items-center gap-inherit', isLoading && 'opacity-90')}>
        {children}
      </span>
    </button>
  );
};