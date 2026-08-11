import { useEffect, useRef, type ReactNode } from 'react';

interface BuilderStepFrameProps {
  stepIndex: number;
  title: string;
  description?: string;
  children: ReactNode;
}

// Every navigation path (Next/Back, stepper click, Review "Edit" link) changes `stepIndex` through
// one shared handler in ChecklistBuilder — so moving focus to the new step's heading here covers
// all of them at once instead of needing a focus fix at each call site.
export const BuilderStepFrame = ({ stepIndex, title, description, children }: BuilderStepFrameProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold text-text outline-none">
          {title}
        </h2>
        {description && <p className="text-sm font-display text-text-muted mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
};
