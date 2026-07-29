import { Users } from 'lucide-react';

export interface UserRow {
  id: string;
  name: string;
  openTickets: number;
  openTasks: number;
  overdue: number;
}

// Admin-only — same idea as DepartmentBreakdown, but sliced per user instead of per department,
// so admins can spot who's overloaded (or idle) rather than just which team.
export const UserBreakdown = ({ rows }: { rows: UserRow[] }) => {
  const top = [...rows]
    .sort((a, b) => (b.openTickets + b.openTasks) - (a.openTickets + a.openTasks))
    .slice(0, 8);
  const maxOpen = Math.max(1, ...top.map(r => r.openTickets + r.openTasks));

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Users size={15} className="text-primary-500" />
        <h2 className="text-sm font-display font-semibold text-text">By user</h2>
      </div>

      {top.length === 0 ? (
        <p className="text-sm text-text-muted font-display px-5 py-6">No user data yet.</p>
      ) : (
        <div className="flex flex-col">
          {top.map(row => (
            <div key={row.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-b-0">
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
