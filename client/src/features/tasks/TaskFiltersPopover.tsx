import { lazy, Suspense, useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '../../components';
import { STATUS_LABEL } from './taskDisplay';
import { avatarColorClass } from './avatarColors';
import { getInitials } from '../../lib/getInitials';
import type { Task } from '../../api/task';
import type { Department } from '../../api/departments';
import type { AssignableUser } from '../../api/users';
import type { CategoryFilterKey } from './taskFilters';

export interface TaskFilters {
  category:     CategoryFilterKey;
  status:       Task['status'] | 'all';
  priority:     Task['priority'][];
  departmentId: string;
  assigneeIds:  string[];
  /** Who raised/created the task (task.userId) — a distinct dimension from assigneeIds (who
   *  it's assigned to). Someone can raise a task for a department without assigning themselves. */
  raisedByIds:  string[];
}

interface TaskFiltersPopoverProps {
  filters:          TaskFilters;
  onChange:         (patch: Partial<TaskFilters>) => void;
  onClearAll:       () => void;
  departments?:     Department[];
  assignableUsers?: AssignableUser[];
  currentUserId?:   string;
  isAdmin?:         boolean;
  activeCount:      number;
}

// Lazy-loaded — pulls in the whole admin user-management form, which most users viewing this
// filter popover (non-admins) never trigger, so it shouldn't sit in the main bundle.
const UserForm = lazy(() =>
  import('../admin/users/UserForm').then((m) => ({ default: m.UserForm })),
);

const STATUS_OPTIONS: { value: Task['status']; label: string }[] =
  (Object.entries(STATUS_LABEL) as [Task['status'], string][]).map(([value, label]) => ({ value, label }));

const CATEGORY_OPTIONS: { value: CategoryFilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'issue', label: 'Issue' },
  { value: 'delegation', label: 'Delegation' },
  { value: 'task', label: 'Task' },
];

const PRIORITY_OPTIONS: { value: Task['priority']; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const toggleValue = <T,>(arr: T[], value: T): T[] =>
  arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

const PillButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
      active ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
    }`}
  >
    {children}
  </button>
);

export const TaskFiltersPopover = ({
  filters, onChange, onClearAll, departments, assignableUsers, currentUserId, isAdmin = false, activeCount,
}: TaskFiltersPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TaskFilters>(filters);
  const [showAddUser, setShowAddUser] = useState(false);

  // Re-sync the draft to the committed filters whenever the popover opens, so a stale edit
  // left over from last time (never Applied) doesn't reappear.
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(filters);
    setOpen(next);
  };

  const departmentOptions: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  const isAssignedToMe = !!currentUserId && draft.assigneeIds.length === 1 && draft.assigneeIds[0] === currentUserId;
  const isAllTeam = draft.assigneeIds.length === 0;

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <>
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="relative px-2.5 border-0 shadow-none rounded-full"
          aria-label="Filters"
          title="Filters"
        >
          <span className="flex items-center justify-center size-5 rounded-full text-primary-600 shrink-0">
            <Filter size={13} strokeWidth={2.5} />
          </span>
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-bold rounded-full bg-primary-600 text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4 flex flex-col gap-4 max-h-[32rem] overflow-y-auto">
        {(!!assignableUsers?.length || isAdmin) && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Assignee</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(assignableUsers ?? []).map((u) => {
                const name = `${u.firstName} ${u.lastName ?? ''}`.trim();
                const selected = draft.assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, assigneeIds: toggleValue(d.assigneeIds, u.id) }))}
                    title={name}
                    aria-pressed={selected}
                    className={`flex items-center justify-center size-8 rounded-full text-[11px] font-bold text-white transition-all cursor-pointer ${avatarColorClass(name)} ${
                      selected ? 'ring-2 ring-offset-2 ring-primary-500 ring-offset-surface' : 'opacity-45 hover:opacity-100'
                    }`}
                  >
                    {getInitials(name)}
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(true);
                    setOpen(false);
                  }}
                  title="Add a new user"
                  aria-label="Add a new user"
                  className="flex items-center justify-center size-8 rounded-full border border-dashed border-border-hover text-text-light hover:text-primary-600 hover:border-primary-400 transition-colors cursor-pointer"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        )}

        {!!assignableUsers?.length && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Raised by</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {assignableUsers.map((u) => {
                const name = `${u.firstName} ${u.lastName ?? ''}`.trim();
                const selected = draft.raisedByIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, raisedByIds: toggleValue(d.raisedByIds, u.id) }))}
                    title={name}
                    aria-pressed={selected}
                    className={`flex items-center justify-center size-8 rounded-full text-[11px] font-bold text-white transition-all cursor-pointer ${avatarColorClass(name)} ${
                      selected ? 'ring-2 ring-offset-2 ring-primary-500 ring-offset-surface' : 'opacity-45 hover:opacity-100'
                    }`}
                  >
                    {getInitials(name)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</span>
          <div className="grid grid-cols-2 gap-1.5">
            <PillButton active={draft.status === 'all'} onClick={() => setDraft(d => ({ ...d, status: 'all' }))}>
              All
            </PillButton>
            {STATUS_OPTIONS.map((opt) => (
              <PillButton key={opt.value} active={draft.status === opt.value} onClick={() => setDraft(d => ({ ...d, status: opt.value }))}>
                {opt.label}
              </PillButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Category</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <PillButton key={opt.value} active={draft.category === opt.value} onClick={() => setDraft(d => ({ ...d, category: opt.value }))}>
                {opt.label}
              </PillButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Priority</span>
          <div className="flex flex-col gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => {
              const checked = draft.priority.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setDraft(d => ({ ...d, priority: toggleValue(d.priority, opt.value) }))}
                    className="size-4 rounded border-border-hover text-primary-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500/40"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Department</span>
          <div className="flex flex-wrap gap-1.5">
            {departmentOptions.map((opt) => (
              <PillButton key={opt.value} active={draft.departmentId === opt.value} onClick={() => setDraft(d => ({ ...d, departmentId: opt.value }))}>
                {opt.label}
              </PillButton>
            ))}
          </div>
        </div>

        {currentUserId && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Assigned to</span>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                <input
                  type="radio"
                  name="assigned-to"
                  checked={isAssignedToMe}
                  onChange={() => setDraft(d => ({ ...d, assigneeIds: [currentUserId] }))}
                  className="size-4 text-primary-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500/40"
                />
                Assigned to me
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                <input
                  type="radio"
                  name="assigned-to"
                  checked={isAllTeam}
                  onChange={() => setDraft(d => ({ ...d, assigneeIds: [] }))}
                  className="size-4 text-primary-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500/40"
                />
                All team
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => {
              onClearAll();
              setOpen(false);
            }}
            disabled={activeCount === 0}
            className="text-xs font-semibold text-text-muted hover:text-danger transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
          <Button variant="primary" size="sm" className="flex-1 rounded-full" onClick={apply}>
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    {showAddUser && (
      <Suspense fallback={null}>
        <UserForm onClose={() => setShowAddUser(false)} />
      </Suspense>
    )}
    </>
  );
};
