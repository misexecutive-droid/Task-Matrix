import { Building2 } from 'lucide-react';

export interface DepartmentRow {
  name: string;
  openTickets: number;
  openTasks: number;
  overdue: number;
}

// Admin-only — org-wide totals hide where the load actually is, so this breaks the same
// numbers down per department instead of leaving admins with just one flat aggregate.
export const DepartmentBreakdown = ({ rows }: { rows: DepartmentRow[] }) => {
  const maxOpen = Math.max(1, ...rows.map(r => r.openTickets + r.openTasks));

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Building2 size={15} className="text-primary-500" />
        <h2 className="text-sm font-display font-semibold text-text">By department</h2>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-text-muted font-display px-5 py-6">No department data yet.</p>
      ) : (
        <div className="flex flex-col">
          {rows.map(row => (
            <div key={row.name} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0">
              <p className="w-32 shrink-0 text-sm font-display text-text truncate">{row.name}</p>
              <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                  style={{ width: `${((row.openTickets + row.openTasks) / maxOpen) * 100}%` }}
                />
              </div>
              <span className="text-xs font-display text-text-muted shrink-0 w-28 text-right">
                {row.openTickets} tickets · {row.openTasks} tasks
              </span>
              <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0 w-16 text-center ${
                row.overdue > 0 ? 'bg-danger/10 text-danger' : 'bg-surface-hover text-text-muted'
              }`}>
                {row.overdue} overdue
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
