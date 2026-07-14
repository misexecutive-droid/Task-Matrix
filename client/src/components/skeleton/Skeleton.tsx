import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-surface-hover ${className}`}
    role="status"
    aria-label="Loading"
    {...props}
  />
);