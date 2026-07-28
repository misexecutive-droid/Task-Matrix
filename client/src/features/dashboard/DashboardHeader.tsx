import { greeting } from './dashboardDisplay';

export const DashboardHeader = ({ userName }: { userName?: string }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-display font-semibold text-text">
        {greeting()}{userName ? `, ${userName}` : ''}
      </h1>
      <p className="text-sm text-text-muted mt-1">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  </div>
);
