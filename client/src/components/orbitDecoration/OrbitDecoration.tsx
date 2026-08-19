import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrbitDecorationProps {
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  tone?: 'primary' | 'coral';
  className?: string;
}

const CORNER_CLASS: Record<OrbitDecorationProps['corner'], string> = {
  'top-left': '-top-14 -left-14',
  'top-right': '-top-14 -right-14',
  'bottom-left': '-bottom-14 -left-14',
  'bottom-right': '-bottom-14 -right-14',
};

// A decorative "orbit" — three concentric rings sharing one center (each just an inset % of the
// same square box, so they stay perfectly centered) plus one dot that revolves around them by
// spinning a full-size wrapper offset to the ring's edge. Purely ornamental — aria-hidden.
export const OrbitDecoration = ({ corner, tone = 'primary', className }: OrbitDecorationProps) => {
  const ring = tone === 'coral' ? 'border-coral-400/30 dark:border-coral-400/20' : 'border-primary-400/30 dark:border-primary-400/20';
  const dot = tone === 'coral' ? 'bg-coral-500/70' : 'bg-primary-500/70';

  return (
    <div aria-hidden="true" className={cn('absolute -z-10 w-48 h-48 pointer-events-none', CORNER_CLASS[corner], className)}>
      <div className={cn('absolute inset-0 rounded-full border', ring)} />
      <div className={cn('absolute inset-[24%] rounded-full border', ring)} />
      <div className={cn('absolute inset-[44%] rounded-full border', ring)} />
      <div className="absolute inset-0 animate-orbit-slow">
        <span className={cn('absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full', dot)} />
      </div>
    </div>
  );
};
