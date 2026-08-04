import { Users } from 'lucide-react';

export interface UserRow {
  id: string;
  name: string;
  openTickets: number;
  openTasks: number;
  overdue: number;
}

export const UserBreakdown = ({ rows }: { rows: UserRow[] }) => {
  const top = [...rows]
    .sort((a, b) => (b.openTickets + b.openTasks) - (a.openTickets + a.openTasks))
    .slice(0, 8);
  const maxOpen = Math.max(1, ...top.map(r => r.openTickets + r.openTasks));

  return (
    <div className="relative group rounded-2xl border border-border/60 bg-surface flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      
      {/* Decorative Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-5 border-b border-border/40 bg-surface/50 backdrop-blur-sm">
        <div className="p-2 rounded-xl border border-border/50 bg-surface-hover flex items-center justify-center shadow-sm">
          <Users size={18} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-text tracking-tight">By User</h2>
          <p className="text-xs font-display text-text-muted mt-0.5">Top individual active workload</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col p-2">
        {top.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
            <p className="text-sm text-text-muted font-display font-medium">No user data yet.</p>
          </div>
        ) : (
          top.map(row => (
            <div 
              key={row.id} 
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-hover/60 transition-colors"
            >
              {/* User Name */}
              <p 
                className="w-32 shrink-0 text-sm font-display font-medium text-text truncate"
                title={row.name}
              >
                {row.name}
              </p>
              
              {/* Progress Bar */}
              <div className="flex-1 h-2 bg-surface-hover border border-border/30 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((row.openTickets + row.openTasks) / maxOpen) * 100}%` }}
                />
              </div>
              
              {/* Stats Breakdown */}
              <span className="text-xs font-display text-text-muted shrink-0 w-32 text-right">
                <strong className="font-semibold text-text">{row.openTickets}</strong> tickets · <strong className="font-semibold text-text">{row.openTasks}</strong> tasks
              </span>
              
              {/* Overdue Badge */}
              <span className={`inline-flex items-center justify-center text-[11px] font-display font-semibold px-2.5 py-1 rounded-full shrink-0 w-20 text-center border transition-colors ${
                row.overdue > 0 
                  ? 'bg-danger/15 text-danger border-danger/20 shadow-sm' 
                  : 'bg-surface border-border/50 text-text-muted opacity-70'
              }`}>
                {row.overdue} overdue
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};