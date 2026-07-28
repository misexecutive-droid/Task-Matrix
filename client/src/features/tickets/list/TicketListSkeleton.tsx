import { Skeleton } from '../../../components';

export const TicketListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-surface/50">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="flex items-center gap-2 pt-1 border-t border-border/30">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);
