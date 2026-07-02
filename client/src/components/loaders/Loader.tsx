import React from "react";

interface LoaderProps {
  size?:  'sm' | 'md' | 'lg';
  color?: 'navy' | 'white';
}

const sizeMap = {
  sm: 'size-4  border-2',
  md: 'size-6  border-2',
  lg: 'size-10 border-[3px]',
};

const colorMap = {
  navy:  'border-navy-600/20  border-t-navy-900',
  white: 'border-white/20     border-t-white',
};

export const Loader: React.FC<LoaderProps> = ({ size = 'md', color = 'navy' }) => (
  <div
    className={`rounded-full animate-spin ${sizeMap[size]} ${colorMap[color]}`}
    role="status"
    aria-label="Loading"
  />
);
