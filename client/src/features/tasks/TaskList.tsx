import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Wand2, CheckCheck, AlertCircle, LayoutList, Kanban, Table2, GanttChartSquare, Check, Save, Inbox, X, Plus, Settings2, FileDown } from "lucide-react";
import { Button, Skeleton, DateRangePicker, type DateRangeValue } from "../../components";
import { ExportDialog } from "../reports";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useTasksQuery, useAssignableUsersQuery } from "./hook";
import { useDepartmentsQuery } from "../tickets/hook";
import type { Task } from '../../api/task';
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";
import { TaskBoard } from "./TaskBoard";
import { TaskTable } from "./TaskTable";
import { TaskTimeline } from "./TaskTimeline";
import { TaskRow } from "./TaskRow";
import { SmartTaskModal } from "./SmartTaskModal";
import { TaskFiltersPopover, type TaskFilters } from "./TaskFiltersPopover";
import { CATEGORY_PREDICATES, SORT_LABEL, SORT_ICON, SORT_COMPARATORS, type CategoryFilterKey, type TaskSortKey } from "./taskFilters";
import { STATUS_LABEL, PRIORITY_MAP } from "./taskDisplay";
import { useCardFieldVisibility, CARD_FIELD_CONFIG, taskAssigneeIds } from "./cardFields";
import { useAuth } from "../../context/AuthContext"

// Groups tasks by due date (day granularity), earliest first, with undated tasks in one
// trailing bucket. Used by the list view below — the board view keeps its own status-column
// grouping. Department is still visible per-row (via Customize Cards), just no longer the
// grouping key.
const groupByDueDate = (tasks: Task[]) => {
    const groups = new Map<string, { key: string; label: string; sortValue: number; tasks: Task[] }>();

    for (const task of tasks) {
        const due = task.dueDate ? new Date(task.dueDate) : null;
        const key = due ? due.toDateString() : '__none__';
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                label: due
                    ? due.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'No due date',
                sortValue: due ? due.setHours(0, 0, 0, 0) : Number.MAX_SAFE_INTEGER,
                tasks: [],
            });
        }
        groups.get(key)!.tasks.push(task);
    }

    return [...groups.values()].sort((a, b) => a.sortValue - b.sortValue);
};

interface TaskListProps {
    userId?: string;
    hideHeader?: boolean;
}

type TaskView = 'list' | 'board' | 'table' | 'timeline';

const VIEW_TABS: { key: TaskView; label: string; icon: typeof LayoutList }[] = [
    { key: 'list', label: 'List', icon: LayoutList },
    { key: 'board', label: 'Board', icon: Kanban },
    { key: 'table', label: 'Table', icon: Table2 },
    { key: 'timeline', label: 'Timeline', icon: GanttChartSquare },
];

const DEFAULT_FILTERS: TaskFilters = { category: 'all', status: 'all', priority: [], departmentId: '', assigneeIds: [], raisedByIds: [] };

const filtersStorageKey = (userId?: string) => `task-filters:${userId ?? 'anon'}`;

export const TaskList = ({ userId, hideHeader = false }: TaskListProps = {}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isVerifier = user?.role === "PC" || user?.role === "ADMIN";
    const [searchParams] = useSearchParams();
    const [ showSmartModal , setShowSmartModal ] = useState(false)
    const [showForm, setShowForm] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [selected, setSelected] = useState<Task | null>(null);
    const { data: tasks, isPending, isError } = useTasksQuery(userId);
    const { data: assignableUsers } = useAssignableUsersQuery();
    const { data: departments } = useDepartmentsQuery();

    // Sidebar links (e.g. "Delegated Tasks", "Pending Approvals") pass their filter via URL
    // search params, which take priority over a saved filter — otherwise, restore whatever the
    // user last saved with "Save this filter" for this account, if anything.
    const [filters, setFilters] = useState<TaskFilters>(() => {
        const fromUrl: Partial<TaskFilters> = {};
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        if (category) fromUrl.category = category as CategoryFilterKey;
        if (status) fromUrl.status = status as Task['status'];
        if (Object.keys(fromUrl).length) return { ...DEFAULT_FILTERS, ...fromUrl };

        try {
            const raw = localStorage.getItem(filtersStorageKey(user?.id));
            if (raw) {
                const saved = JSON.parse(raw);
                // priority/assigneeIds used to be single values before multi-select — drop an
                // old-shaped saved filter's value for those two fields rather than crash on it.
                // raisedByIds didn't exist at all before — same treatment for a filter saved
                // before this field was introduced.
                if (!Array.isArray(saved.priority)) delete saved.priority;
                if (!Array.isArray(saved.assigneeIds)) delete saved.assigneeIds;
                if (!Array.isArray(saved.raisedByIds)) delete saved.raisedByIds;
                return { ...DEFAULT_FILTERS, ...saved };
            }
        } catch {
            // Corrupt/unavailable localStorage — fall through to defaults.
        }
        return DEFAULT_FILTERS;
    });
    const [sort, setSort] = useState<TaskSortKey>('dueDate');
    const [view, setView] = useState<TaskView>('board');
    const { visibility: fieldVisibility, toggle: toggleField } = useCardFieldVisibility();
    // Built into the toolbar for everyone — admin/PC get it org-wide same as their other
    // filters, a regular user gets it scoped to their own tasks same as everything else here.
    const [dueDateRange, setDueDateRange] = useState<DateRangeValue>({ from: null, to: null });

    const updateFilters = (patch: Partial<TaskFilters>) => setFilters(f => ({ ...f, ...patch }));
    const clearFilters = () => setFilters(DEFAULT_FILTERS);
    const saveFilters = () => {
        try {
            localStorage.setItem(filtersStorageKey(user?.id), JSON.stringify(filters));
            toast.success('Filter saved');
        } catch {
            toast.error('Could not save filter');
        }
    };

    const assigneeNames = new Map(
        (assignableUsers ?? []).map(u => [u.id, `${u.firstName} ${u.lastName ?? ''}`.trim()]),
    );
    const departmentNames = new Map((departments ?? []).map(d => [d.id, d.name]));

    // Due-date range filter — tasks with no due date drop out once a range is set, since
    // "due between this date and that date" can't match a task that has no due date at all.
    const dateFiltered = !dueDateRange.from
        ? (tasks ?? [])
        : (tasks ?? []).filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            const from = new Date(dueDateRange.from!.getFullYear(), dueDateRange.from!.getMonth(), dueDateRange.from!.getDate());
            if (due < from) return false;
            if (dueDateRange.to) {
                const to = new Date(dueDateRange.to.getFullYear(), dueDateRange.to.getMonth(), dueDateRange.to.getDate(), 23, 59, 59, 999);
                if (due > to) return false;
            }
            return true;
        });

    const categoryFiltered = dateFiltered.filter(CATEGORY_PREDICATES[filters.category]);
    const priorityFiltered = filters.priority.length === 0 ? categoryFiltered : categoryFiltered.filter(t => filters.priority.includes(t.priority));
    const departmentFiltered = filters.departmentId ? priorityFiltered.filter(t => t.departmentId === filters.departmentId) : priorityFiltered;
    const assigneeFiltered = filters.assigneeIds.length === 0
        ? departmentFiltered
        : departmentFiltered.filter(t => taskAssigneeIds(t).some(id => filters.assigneeIds.includes(id)));
    const raisedByFiltered = filters.raisedByIds.length === 0
        ? assigneeFiltered
        : assigneeFiltered.filter(t => filters.raisedByIds.includes(t.userId));
    const filtered = filters.status === 'all' ? raisedByFiltered : raisedByFiltered.filter(t => t.status === filters.status);

    const sorted = [...filtered].sort(SORT_COMPARATORS[sort]);
    const dateGroups = groupByDueDate(sorted);

    const formatShortDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const activeChips: { key: string; label: string; onClear: () => void }[] = [
        ...(filters.status !== 'all' ? [{ key: 'status', label: `Status: ${STATUS_LABEL[filters.status]}`, onClear: () => updateFilters({ status: 'all' }) }] : []),
        ...(filters.category !== 'all' ? [{ key: 'category', label: `Category: ${filters.category === 'task' ? 'Tasks' : filters.category === 'issue' ? 'Issues' : 'Delegations'}`, onClear: () => updateFilters({ category: 'all' }) }] : []),
        ...(filters.priority.length > 0 ? [{
            key: 'priority',
            label: `Priority: ${filters.priority.map(p => PRIORITY_MAP[p].label).join(', ')}`,
            onClear: () => updateFilters({ priority: [] }),
        }] : []),
        ...(filters.departmentId ? [{ key: 'departmentId', label: `Dept: ${departmentNames.get(filters.departmentId) ?? 'Unknown'}`, onClear: () => updateFilters({ departmentId: '' }) }] : []),
        ...(filters.assigneeIds.length > 0 ? [{
            key: 'assigneeIds',
            label: filters.assigneeIds.length === 1
                ? `Assignee: ${assigneeNames.get(filters.assigneeIds[0]) ?? 'Unknown'}`
                : `Assignees: ${filters.assigneeIds.length}`,
            onClear: () => updateFilters({ assigneeIds: [] }),
        }] : []),
        ...(filters.raisedByIds.length > 0 ? [{
            key: 'raisedByIds',
            label: filters.raisedByIds.length === 1
                ? `Raised by: ${assigneeNames.get(filters.raisedByIds[0]) ?? 'Unknown'}`
                : `Raised by: ${filters.raisedByIds.length}`,
            onClear: () => updateFilters({ raisedByIds: [] }),
        }] : []),
        ...(dueDateRange.from ? [{
            key: 'dueDateRange',
            label: `Due: ${formatShortDate(dueDateRange.from)}${dueDateRange.to ? ` – ${formatShortDate(dueDateRange.to)}` : ''}`,
            onClear: () => setDueDateRange({ from: null, to: null }),
        }] : []),
    ];

    const isEmpty = sorted.length === 0;

    return (
        <div className="flex flex-col gap-6 mx-auto w-full max-w-[1400px] transition-all duration-300">
            
            {/* Header & Controls Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
                {!hideHeader && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center text-primary-700 shrink-0">
                            <CheckCheck size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text tracking-tight">Tasks</h1>
                            <p className="text-sm text-text-muted mt-0.5">
                                {tasks?.length ?? 0} total task{tasks?.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                )}

                <div className={`flex items-center gap-2 flex-wrap ${hideHeader ? 'ml-auto' : ''}`}>
                    {/* View Toggle (Segmented Control) */}
                    <div className="flex items-center gap-0.5 p-1 rounded-full">
                        {VIEW_TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setView(tab.key)}
                                title={`${tab.label} view`}
                                aria-label={`${tab.label} view`}
                                aria-pressed={view === tab.key}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
                                    view === tab.key
                                        ? 'bg-surface text-text shadow-xs'
                                        : 'text-text-muted hover:text-text-secondary hover:bg-surface-active/50'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {!userId && isAdmin && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="px-2.5 border-0 shadow-none rounded-full"
                            onClick={() => setShowSmartModal(true)}
                            aria-label="Smart Task"
                            title="Smart Task"
                        >
                            <Wand2 size={16} strokeWidth={2} />
                        </Button>
                    )}

                    {!userId && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="group gap-2 font-semibold shadow-sm rounded-full"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
                            New Task
                        </Button>
                    )}

                    <TaskFiltersPopover
                        filters={filters}
                        onChange={updateFilters}
                        onClearAll={clearFilters}
                        departments={departments}
                        assignableUsers={assignableUsers}
                        currentUserId={user?.id}
                        isAdmin={isAdmin}
                        activeCount={activeChips.length}
                    />

                    <DateRangePicker
                        value={dueDateRange}
                        onChange={setDueDateRange}
                        placeholder="Due date"
                        className="w-auto"
                        triggerClassName="h-8 w-auto rounded-full text-xs px-3"
                    />

                    <span className="text-xs font-medium text-text-muted whitespace-nowrap">
                        {sorted.length} task{sorted.length !== 1 ? 's' : ''}
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="px-2.5 border-0 shadow-none rounded-full"
                                aria-label={`Sort: ${SORT_LABEL[sort]}`}
                                title={`Sort: ${SORT_LABEL[sort]}`}
                            >
                                {(() => {
                                    const SortIcon = SORT_ICON[sort];
                                    return <SortIcon size={14} />;
                                })()}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {(Object.keys(SORT_LABEL) as TaskSortKey[]).map(key => {
                                const Icon = SORT_ICON[key];
                                return (
                                    <DropdownMenuItem key={key} onClick={() => setSort(key)} className="gap-2">
                                        <Icon size={14} className="text-text-light" />
                                        {SORT_LABEL[key]}
                                        {sort === key && <Check size={14} className="ml-auto text-primary-600" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1.5 border-0 shadow-none rounded-full"
                                aria-label="Customize cards"
                                title="Customize cards"
                            >
                                <Settings2 size={14} />
                                Customize cards
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Show only</DropdownMenuLabel>
                            {CARD_FIELD_CONFIG.map(({ key, label, icon: Icon }) => (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    checked={fieldVisibility[key]}
                                    onCheckedChange={() => toggleField(key)}
                                    onSelect={(e) => e.preventDefault()}
                                    className="gap-2"
                                >
                                    <Icon size={14} className="text-text-light" />
                                    {label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 border-0 shadow-none rounded-full"
                        onClick={() => setShowExport(true)}
                        aria-label="Export tasks"
                        title="Export tasks"
                    >
                        <FileDown size={14} />
                        Export
                    </Button>
                </div>
            </div>

            {/* Active filter chips — only takes up space once something is actually filtered */}
            {activeChips.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {activeChips.map(chip => (
                        <span
                            key={chip.key}
                            className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-700 border border-primary-200"
                        >
                            {chip.label}
                            <button
                                type="button"
                                onClick={chip.onClear}
                                aria-label={`Clear ${chip.label} filter`}
                                className="p-0.5 rounded-full hover:bg-primary-100 transition-colors cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}

                    <button
                        type="button"
                        onClick={saveFilters}
                        title="Save this filter combination as your default"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-200 cursor-pointer"
                    >
                        <Save size={13} />
                        Save this filter
                    </button>
                </div>
            )}

            {/* Loading States */}
            {isPending && view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 rounded border border-border bg-surface">
                            <Skeleton className="w-5 h-5 rounded-md shrink-0" />
                            <Skeleton className="h-5 flex-1 max-w-md" />
                            <Skeleton className="h-6 w-20 rounded-md shrink-0" />
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {isPending && view === 'table' && (
                <div className="flex flex-col gap-1 rounded border border-border overflow-hidden">
                    <Skeleton className="h-9 w-full rounded-none" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-6 px-4 py-2.5 bg-surface">
                            <Skeleton className="h-4 flex-1 max-w-xs" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            )}

            {isPending && view === 'timeline' && (
                <div className="flex flex-col gap-1 rounded border border-border overflow-hidden">
                    <Skeleton className="h-9 w-full rounded-none" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-surface">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-6 flex-1 max-w-xs rounded-md" />
                        </div>
                    ))}
                </div>
            )}

            {isPending && view === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                    {Array.from({ length: 4 }).map((_, col) => (
                        <div key={col} className="flex flex-col gap-4 p-3 bg-surface-hover/50 border border-border rounded">
                            <Skeleton className="h-6 w-32 rounded-md mx-2 mt-2" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-3 p-4 rounded border border-border bg-surface">
                                    <Skeleton className="h-5 w-3/4 rounded-md" />
                                    <Skeleton className="h-4 w-1/2 rounded-md" />
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-5 w-16 rounded-md" />
                                        <Skeleton className="w-7 h-7 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <div className="flex items-start gap-3 p-4 bg-danger/10 rounded border border-danger/20 text-danger">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold">Error Loading Tasks</h4>
                        <p className="text-sm mt-1">Failed to connect to the server. Please refresh the page.</p>
                    </div>
                </div>
            )}

            {!isPending && !isError && isEmpty && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-hover/40 rounded border-2 border-dashed border-border">
                    <div className="flex items-center justify-center mb-4 text-text-light">
                        <Inbox size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-text tracking-tight">No tasks found</h3>
                    <p className="text-sm text-text-muted mt-1 max-w-sm">
                        {activeChips.length > 0
                            ? "No tasks match the current filters — try clearing one or more of them."
                            : "You're all caught up! There are no tasks assigned to this view."}
                    </p>
                </div>
            )}

            {/* List View Render */}
            {!isPending && !isError && !isEmpty && view === 'list' && (() => {
                let rowIndex = 0;
                return (
                    <div className="flex flex-col gap-6 pb-10">
                        {dateGroups.map(group => (
                            <div key={group.key} className="flex flex-col gap-3">
                                {/* Date Header */}
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-text tracking-tight">
                                        {group.label}
                                    </h3>
                                    <span className="flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 text-[10px] font-bold text-text-muted bg-surface-hover rounded-full border border-border shadow-xs">
                                        {group.tasks.length}
                                    </span>
                                    <div className="flex-1 h-px bg-border/60" /> {/* Clean divider line */}
                                </div>
                                
                                {/* Tasks Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {group.tasks.map(task => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            isVerifier={isVerifier}
                                            onOpen={setSelected}
                                            index={rowIndex++}
                                            assigneeName={task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined}
                                            departmentName={task.departmentId ? departmentNames.get(task.departmentId) : undefined}
                                            fields={fieldVisibility}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Board View Render */}
            {!isPending && !isError && !isEmpty && view === 'board' && (
                <div className="pb-10">
                    <TaskBoard
                        tasks={sorted}
                        assigneeNames={assigneeNames}
                        departmentNames={departmentNames}
                        isVerifier={isVerifier}
                        onOpen={setSelected}
                        onAddTask={() => setShowForm(true)}
                        fields={fieldVisibility}
                    />
                </div>
            )}

            {/* Table View Render */}
            {!isPending && !isError && !isEmpty && view === 'table' && (
                <div className="pb-10">
                    <TaskTable
                        tasks={sorted}
                        assigneeNames={assigneeNames}
                        departmentNames={departmentNames}
                        onOpen={setSelected}
                        fields={fieldVisibility}
                    />
                </div>
            )}

            {/* Timeline View Render */}
            {!isPending && !isError && !isEmpty && view === 'timeline' && (
                <div className="pb-10">
                    <TaskTimeline tasks={sorted} assigneeNames={assigneeNames} onOpen={setSelected} />
                </div>
            )}

            {/* Modals */}
            {showForm && (
                <TaskForm
                    onClose={() => setShowForm(false)}
                    onCreated={(task) => setSelected(task)}
                />
            )}
            {showSmartModal && <SmartTaskModal onClose={() => setShowSmartModal(false)} />}
            {showExport && (
                <ExportDialog
                    reportModule="tasks"
                    title="Export Tasks"
                    description="Every task matching your current filters — status, priority, department, and assignee."
                    onClose={() => setShowExport(false)}
                    filters={{
                        category: filters.category !== 'all' ? filters.category : undefined,
                        status: filters.status !== 'all' ? filters.status : undefined,
                        priority: filters.priority.length ? filters.priority : undefined,
                        departmentId: filters.departmentId || undefined,
                        assigneeIds: filters.assigneeIds.length ? filters.assigneeIds : undefined,
                    }}
                />
            )}
            {selected && (
                <TaskDetail
                    key={selected.id}
                    task={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
};