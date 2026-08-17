import { Skeleton } from '../../../components';

export const TicketListSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-border/60 bg-surface">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-3 w-3/4 rounded-md" />
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-14 rounded" />
            <Skeleton className="h-4 w-14 rounded" />
          </div>
          <Skeleton className="size-6 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);
