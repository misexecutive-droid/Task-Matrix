import { Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { STATUS_LABEL } from './taskDisplay';
import type { Task } from '../../api/task';
import type { Department } from '../../api/departments';
import type { CategoryFilterKey } from './taskFilters';

export interface TaskFilters {
  category:     CategoryFilterKey;
  status:       Task['status'] | 'all';
  priority:     Task['priority'] | 'all';
  departmentId: string;
}

interface TaskFiltersPopoverProps {
  filters:      TaskFilters;
  onChange:     (patch: Partial<TaskFilters>) => void;
  onClearAll:   () => void;
  departments?: Department[];
  activeCount:  number;
}

const STATUS_OPTIONS: { value: Task['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...(Object.entries(STATUS_LABEL) as [Task['status'], string][]).map(([value, label]) => ({ value, label })),
];

const CATEGORY_OPTIONS: { value: CategoryFilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'issue', label: 'Issues' },
  { value: 'delegation', label: 'Delegations' },
  { value: 'task', label: 'Tasks' },
];

const PRIORITY_OPTIONS: { value: Task['priority'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const FilterGroup = <T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            value === opt.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export const TaskFiltersPopover = ({ filters, onChange, onClearAll, departments, activeCount }: TaskFiltersPopoverProps) => {
  const departmentOptions: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded border border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          <Filter size={14} />
          Filters
          {activeCount > 0 && (
            <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700">
              {activeCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4 flex flex-col gap-4">
        <FilterGroup label="Status" options={STATUS_OPTIONS} value={filters.status} onChange={(v) => onChange({ status: v })} />
        <FilterGroup label="Category" options={CATEGORY_OPTIONS} value={filters.category} onChange={(v) => onChange({ category: v })} />
        <FilterGroup label="Priority" options={PRIORITY_OPTIONS} value={filters.priority} onChange={(v) => onChange({ priority: v })} />
        <FilterGroup label="Department" options={departmentOptions} value={filters.departmentId} onChange={(v) => onChange({ departmentId: v })} />

        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onClearAll}
            disabled={activeCount === 0}
            className="text-xs font-semibold text-text-muted hover:text-danger transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
