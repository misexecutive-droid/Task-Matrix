import { CalendarDays } from 'lucide-react';
import { greeting } from './dashboardDisplay';

export const DashboardHeader = ({ userName }: { userName?: string }) => {
  const currentDate = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-2">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-text tracking-tight">
          {greeting()}
          {userName ? (
            <span className="text-primary-500">, {userName}</span>
          ) : (
            ''
          )}
        </h1>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-hover/60 border border-border/50 text-sm font-display font-medium text-text-muted shadow-sm w-fit transition-colors hover:bg-surface-hover">
          <CalendarDays size={16} className="text-primary-500" />
          <span>{currentDate}</span>
        </div>
      </div>
      
      {/* 
        This empty div keeps the flex-between layout intact in case you 
        want to drop a "Create" button, Date Picker, or Filters on the right side later.
      */}
      <div className="flex items-center gap-3"></div>
    </div>
  );
};