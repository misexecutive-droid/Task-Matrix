import { Building2, ChevronRight, Users } from 'lucide-react';

export interface DepartmentCardRow {
  id: string;
  name: string;
  headcount: number;
  openTickets: number;
  openTasks: number;
  overdue: number;
}

export const DepartmentCard = ({ row, onClick }: { row: DepartmentCardRow; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-surface text-left hover:border-primary-300 transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
          <Building2 size={16} />
        </div>
        <h3 className="text-sm font-semibold text-text truncate">{row.name}</h3>
      </div>
      <ChevronRight size={15} className="shrink-0 text-text-light group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150" />
    </div>

    <div className="flex items-center gap-1.5 text-xs text-text-muted">
      <Users size={12} />
      {row.headcount} {row.headcount === 1 ? 'person' : 'people'}
    </div>

    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
      <span className="text-xs text-text-muted">
        <strong className="font-semibold text-text">{row.openTickets}</strong> tickets · <strong className="font-semibold text-text">{row.openTasks}</strong> tasks
      </span>
      <span className={`inline-flex items-center justify-center text-[11px] font-semibold px-2 py-0.5 rounded ${
        row.overdue > 0 ? 'bg-danger/10 text-danger' : 'bg-surface-hover text-text-muted opacity-70'
      }`}>
        {row.overdue} overdue
      </span>
    </div>
  </button>
);
