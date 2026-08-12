import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Sparkles, CheckCheck, AlertCircle, LayoutList, Kanban, Table2, GanttChartSquare, ArrowUpDown, Save, Inbox, X, Plus } from "lucide-react";
import { Button, Skeleton } from "../../components";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import { CATEGORY_PREDICATES, SORT_LABEL, SORT_COMPARATORS, type CategoryFilterKey, type TaskSortKey } from "./taskFilters";
import { STATUS_LABEL, PRIORITY_MAP } from "./taskDisplay";
import { useAuth } from "../../context/AuthContext"

// Groups tasks by departmentId, sorted alphabetically by department name with "No department"
// always last. Used by the list view below — the board view keeps its own status-column grouping.
const groupByDepartment = (tasks: Task[], departmentNames: Map<string, string>) => {
    const groups = new Map<string, { departmentId: string | null; departmentName: string; tasks: Task[] }>();

    for (const task of tasks) {
        const key = task.departmentId ?? '__none__';
        if (!groups.has(key)) {
            groups.set(key, {
                departmentId: task.departmentId,
                departmentName: task.departmentId ? (departmentNames.get(task.departmentId) ?? 'Unknown department') : 'No department',
                tasks: [],
            });
        }
        groups.get(key)!.tasks.push(task);
    }

    return [...groups.values()].sort((a, b) => {
        if (a.departmentId === null) return 1;
        if (b.departmentId === null) return -1;
        return a.departmentName.localeCompare(b.departmentName);
    });
};

interface TaskListProps {
    userId?: string;
    hideHeader?: boolean;
    dateRange?: { from: Date | null; to: Date | null };
}

type TaskView = 'list' | 'board' | 'table' | 'timeline';

const VIEW_TABS: { key: TaskView; label: string; icon: typeof LayoutList }[] = [
    { key: 'list', label: 'List', icon: LayoutList },
    { key: 'board', label: 'Board', icon: Kanban },
    { key: 'table', label: 'Table', icon: Table2 },
    { key: 'timeline', label: 'Timeline', icon: GanttChartSquare },
];

const DEFAULT_FILTERS: TaskFilters = { category: 'all', status: 'all', priority: 'all', departmentId: '' };

const filtersStorageKey = (userId?: string) => `task-filters:${userId ?? 'anon'}`;

export const TaskList = ({ userId, hideHeader = false, dateRange }: TaskListProps = {}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isVerifier = user?.role === "PC" || user?.role === "ADMIN";
    const [searchParams] = useSearchParams();
    const [ showSmartModal , setShowSmartModal ] = useState(false)
    const [showForm, setShowForm] = useState(false);
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
            if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
        } catch {
            // Corrupt/unavailable localStorage — fall through to defaults.
        }
        return DEFAULT_FILTERS;
    });
    const [sort, setSort] = useState<TaskSortKey>('dueDate');
    const [view, setView] = useState<TaskView>('board');

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

    // Optional client-side date filter (createdAt) — only active when a range is passed in,
    // so every other caller of TaskList that doesn't pass dateRange is unaffected.
    const dateFiltered = !dateRange?.from
        ? (tasks ?? [])
        : (tasks ?? []).filter(t => {
            const created = new Date(t.createdAt);
            const from = new Date(dateRange.from!.getFullYear(), dateRange.from!.getMonth(), dateRange.from!.getDate());
            if (created < from) return false;
            if (dateRange.to) {
                const to = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999);
                if (created > to) return false;
            }
            return true;
        });

    const categoryFiltered = dateFiltered.filter(CATEGORY_PREDICATES[filters.category]);
    const priorityFiltered = filters.priority === 'all' ? categoryFiltered : categoryFiltered.filter(t => t.priority === filters.priority);
    const departmentFiltered = filters.departmentId ? priorityFiltered.filter(t => t.departmentId === filters.departmentId) : priorityFiltered;
    const filtered = filters.status === 'all' ? departmentFiltered : departmentFiltered.filter(t => t.status === filters.status);

    const sorted = [...filtered].sort(SORT_COMPARATORS[sort]);
    const departmentGroups = groupByDepartment(sorted, departmentNames);

    const activeChips: { key: keyof TaskFilters; label: string; onClear: () => void }[] = [
        ...(filters.status !== 'all' ? [{ key: 'status' as const, label: `Status: ${STATUS_LABEL[filters.status]}`, onClear: () => updateFilters({ status: 'all' }) }] : []),
        ...(filters.category !== 'all' ? [{ key: 'category' as const, label: `Category: ${filters.category === 'task' ? 'Tasks' : filters.category === 'issue' ? 'Issues' : 'Delegations'}`, onClear: () => updateFilters({ category: 'all' }) }] : []),
        ...(filters.priority !== 'all' ? [{ key: 'priority' as const, label: `Priority: ${PRIORITY_MAP[filters.priority].label}`, onClear: () => updateFilters({ priority: 'all' }) }] : []),
        ...(filters.departmentId ? [{ key: 'departmentId' as const, label: `Dept: ${departmentNames.get(filters.departmentId) ?? 'Unknown'}`, onClear: () => updateFilters({ departmentId: '' }) }] : []),
    ];

    const isEmpty = sorted.length === 0;

    return (
        <div className="flex flex-col gap-6 mx-auto w-full max-w-[1400px] transition-all duration-300">
            
            {/* Header & Controls Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
                {!hideHeader && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 shrink-0">
                            <CheckCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text tracking-tight">Tasks</h1>
                            <p className="text-sm font-medium text-text-muted mt-0.5">
                                {tasks?.length ?? 0} total task{tasks?.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                )}

                <div className={`flex items-center gap-3 ${hideHeader ? 'ml-auto' : ''}`}>
                    {/* View Toggle (Segmented Control) */}
                    <div className="flex items-center gap-0.5 p-1 bg-surface-hover/60 border border-border rounded-md">
                        {VIEW_TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setView(tab.key)}
                                title={`${tab.label} view`}
                                aria-label={`${tab.label} view`}
                                aria-pressed={view === tab.key}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                                    view === tab.key
                                        ? 'bg-surface text-text shadow-xs border border-border-hover'
                                        : 'text-text-muted hover:text-text-secondary hover:bg-surface-active/50 border border-transparent'
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
                            className="gap-2 font-semibold shadow-sm"
                            onClick={() => setShowSmartModal(true)}
                        >
                            <Sparkles size={16} strokeWidth={2.5} />
                            Smart Task
                        </Button>
                    )}

                    {!userId && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="gap-2 font-semibold shadow-sm"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            New Task
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Bar — Filters popover + active-filter chips on the left, count + sort on the right */}
            <div className="flex items-center gap-2 flex-wrap">
                <TaskFiltersPopover
                    filters={filters}
                    onChange={updateFilters}
                    onClearAll={clearFilters}
                    departments={departments}
                    activeCount={activeChips.length}
                />

                {activeChips.map(chip => (
                    <span
                        key={chip.key}
                        className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    >
                        {chip.label}
                        <button
                            type="button"
                            onClick={chip.onClear}
                            aria-label={`Clear ${chip.label} filter`}
                            className="p-0.5 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}

                <button
                    type="button"
                    onClick={saveFilters}
                    disabled={activeChips.length === 0}
                    title={activeChips.length === 0 ? 'Set a filter first to save it' : 'Save this filter combination as your default'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-dashed border-border text-text-muted hover:text-text hover:border-border-hover hover:bg-surface-hover transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted disabled:hover:border-border"
                >
                    <Save size={13} />
                    Save this filter
                </button>

                <div className="ml-auto flex items-center gap-3">
                    <span className="text-xs font-medium text-text-muted whitespace-nowrap">
                        {sorted.length} task{sorted.length !== 1 ? 's' : ''}
                    </span>
                    <Select value={sort} onValueChange={(v) => setSort(v as TaskSortKey)}>
                        <SelectTrigger className="h-8 text-xs w-44 rounded bg-surface" aria-label="Sort tasks by">
                            <ArrowUpDown size={13} className="text-text-light shrink-0" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.keys(SORT_LABEL) as TaskSortKey[]).map(key => (
                                <SelectItem key={key} value={key}>Sort: {SORT_LABEL[key]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Loading States */}
            {isPending && view === 'list' && (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
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
                                    <div className="flex justify-between items-center mt-2">
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
                    <div className="flex items-center justify-center w-12 h-12 bg-surface rounded border border-border mb-4">
                        <Inbox size={24} className="text-text-light" />
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
                        {departmentGroups.map(group => (
                            <div key={group.departmentId ?? '__none__'} className="flex flex-col gap-3">
                                {/* Department Header */}
                                <div className="flex items-center gap-3 mt-2 mb-1">
                                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                        {group.departmentName}
                                    </h3>
                                    <span className="flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 text-[10px] font-bold text-text-muted bg-surface-hover rounded-full border border-border shadow-xs">
                                        {group.tasks.length}
                                    </span>
                                    <div className="flex-1 h-px bg-border/60" /> {/* Clean divider line */}
                                </div>
                                
                                {/* Tasks Stack */}
                                <div className="flex flex-col gap-2.5">
                                    {group.tasks.map(task => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            isAdmin={isAdmin}
                                            onOpen={setSelected}
                                            index={rowIndex++}
                                            assigneeName={task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined}
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
                        isAdmin={isAdmin}
                        isVerifier={isVerifier}
                        onOpen={setSelected}
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
            {showForm && <TaskForm onClose={() => setShowForm(false)} />}
            {showSmartModal && <SmartTaskModal onClose={() => setShowSmartModal(false)} />}
            {selected && (
                <TaskDetail
                    task={selected}
                    assigneeName={selected.assigneeId ? assigneeNames.get(selected.assigneeId) : undefined}
                    departmentName={selected.departmentId ? departmentNames.get(selected.departmentId) : undefined}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
};