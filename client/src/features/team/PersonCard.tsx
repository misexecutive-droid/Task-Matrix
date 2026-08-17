import { ChevronRight } from 'lucide-react';
import { getInitials } from '../../lib/getInitials';
import { avatarColorClass } from '../tasks/avatarColors';

export interface PersonCardRow {
  id: string;
  name: string;
  role: string;
  openTickets: number;
  openTasks: number;
  overdue: number;
}

export const PersonCard = ({ row, onClick }: { row: PersonCardRow; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-surface text-left hover:border-primary-300 transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex items-center justify-center size-9 rounded-full text-white text-xs font-bold shrink-0 ${avatarColorClass(row.name)}`}>
          {getInitials(row.name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text truncate">{row.name}</h3>
          <p className="text-[11px] text-text-muted truncate">{row.role}</p>
        </div>
      </div>
      <ChevronRight size={15} className="shrink-0 text-text-light group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150" />
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
