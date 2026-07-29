import { useMemo } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { Dropdown, type DropdownAction } from '../../../components';
import { STATUS_FILTERS, type FilterStatus } from './ticketFilters';

interface TicketListControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (key: FilterStatus) => void;
}

export const TicketListControls = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: TicketListControlsProps) => {
  const statusFilterActions: DropdownAction[] = useMemo(
    () =>
      STATUS_FILTERS.map((f) => ({
        label: f.label,
        onClick: () => onStatusFilterChange(f.key),
      })),
    [onStatusFilterChange]
  );

  const activeFilterLabel =
    STATUS_FILTERS.find((f) => f.key === statusFilter)?.label ?? 'All Tickets';

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tickets..."
          className="w-full pl-10 pr-9 py-2 text-xs font-display bg-surface-hover/60 text-text rounded-full border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-surface placeholder:text-text-muted/70 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer transition-colors p-0.5 rounded-full hover:bg-surface-hover"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <Dropdown
        align="start"
        items={statusFilterActions}
        trigger={
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-display font-medium rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
              statusFilter !== 'ALL'
                ? 'bg-primary-500/10 text-primary-500 border-primary-500/30 font-semibold'
                : 'bg-surface-hover/60 text-text-secondary border-border/40 hover:bg-surface-hover hover:text-text'
            }`}
          >
            <Filter size={13} />
            {activeFilterLabel}
            <ChevronDown size={12} />
          </button>
        }
      />
    </div>
  );
};
