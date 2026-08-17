import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router';

export interface DepartmentRow {
  id: string;
  name: string;
  openTickets: number;
  openTasks: number;
  overdue: number;
}

export const DepartmentBreakdown = ({ rows }: { rows: DepartmentRow[] }) => {
  const navigate = useNavigate();
  const maxOpen = Math.max(1, ...rows.map(r => r.openTickets + r.openTasks));

  return (
    <div className="relative group rounded-xl border border-border/60 bg-surface flex flex-col hover:border-primary-300 transition-colors duration-300 overflow-hidden">

      {/* Decorative Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-5 border-b border-border/40 bg-surface/50 backdrop-blur-sm">
        <div className="p-2 rounded-lg border border-border/50 bg-surface-hover flex items-center justify-center">
          <Building2 size={18} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-text tracking-tight">By Department</h2>
          <p className="text-xs font-display text-text-muted mt-0.5">Active workload distribution</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col p-2">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
            <p className="text-sm text-text-muted font-display font-medium">No department data yet.</p>
          </div>
        ) : (
          rows.map(row => (
            <button
              key={row.id}
              type="button"
              onClick={() => navigate(`/tasks?departmentId=${row.id}`)}
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-left hover:bg-surface-hover/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            >
              {/* Department Name */}
              <p className="w-32 shrink-0 text-sm font-display font-medium text-text truncate">
                {row.name}
              </p>
              
              {/* Progress Bar */}
              <div className="flex-1 h-2 bg-surface-hover border border-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((row.openTickets + row.openTasks) / maxOpen) * 100}%` }}
                />
              </div>

              {/* Stats Breakdown */}
              <span className="text-xs font-display text-text-muted shrink-0 w-32 text-right">
                <strong className="font-medium text-text">{row.openTickets}</strong> tickets · <strong className="font-medium text-text">{row.openTasks}</strong> tasks
              </span>

              {/* Overdue Badge */}
              <span className={`inline-flex items-center justify-center text-[11px] font-display font-semibold px-2.5 py-1 rounded-full shrink-0 w-20 text-center transition-colors ${
                row.overdue > 0
                  ? 'bg-danger/10 text-danger'
                  : 'bg-surface-hover text-text-muted opacity-70'
              }`}>
                {row.overdue} overdue
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};