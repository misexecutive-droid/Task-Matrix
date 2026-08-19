import type { ReactNode } from 'react';

// The visual "ladder" — a trunk line running down the left of a group of children, with each
// child branching off it via a short elbow tick. Turns the plain nested-accordion list into an
// actual org-chart read: Store -> Department -> Person is a lineage, not just indentation.
export const TreeTrunk = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-2 border-l-2 border-primary-200/70 dark:border-primary-500/20 ml-[19px] pl-5">
    {children}
  </div>
);

export const TreeNode = ({ children }: { children: ReactNode }) => (
  <div className="relative">
    <span className="absolute -left-5 top-5 w-5 h-0.5 rounded-full bg-primary-200/70 dark:bg-primary-500/20" />
    {children}
  </div>
);
