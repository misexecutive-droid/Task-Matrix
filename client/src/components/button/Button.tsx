import React from "react";
import { Loader } from "../loaders/Loader";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'outline';
  size?:     'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantMap: Record<string, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-amber-500 text-slate-900 hover:bg-amber-400 active:bg-amber-600',
  outline:   'border border-slate-300 text-slate-700 hover:border-primary-500 hover:bg-primary-50',
};

const sizeMap: Record<string, string> = {
  sm: 'px-3   py-1.5 text-xs  gap-1.5',
  md: 'px-5   py-2.5 text-sm  gap-2',
  lg: 'px-7   py-3.5 text-base gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant   = 'primary',
  size      = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center',
        'font-display font-medium tracking-wide',
        'rounded-sm transition-colors duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantMap[variant],
        sizeMap[size],
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && (
        <Loader
          size={size === 'lg' ? 'md' : 'sm'}
          color={variant === 'primary' ? 'white' : 'primary'}
        />
      )}
      {children}
    </button>
  );
};
