import { useState } from "react";
import { Plus, CheckCheck, AlertCircle, LayoutList, Kanban, Inbox } from "lucide-react";
import { Button, Skeleton } from "../../components";
import { useTasksQuery, useAssignableUsersQuery } from "./hook";
import { useDepartmentsQuery } from "../tickets/hook";
import type { Task } from '../../api/task';
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";
import { TaskBoard } from "./TaskBoard";
import { TaskRow } from "./TaskRow";
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

export const TaskList = ({ userId, hideHeader = false, dateRange }: TaskListProps = {}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isVerifier = user?.role === "PC" || user?.role === "ADMIN";
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Task | null>(null);
    const { data: tasks, isPending, isError } = useTasksQuery(userId);
    const { data: assignableUsers } = useAssignableUsersQuery();
    const { data: departments } = useDepartmentsQuery();
    const [filter, setFilter] = useState<Task['status'] | 'all'>('all');
    const [view, setView] = useState<'list' | 'board'>('board');

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

    const filtered = filter === 'all'
        ? dateFiltered
        : dateFiltered.filter(t => t.status === filter);

    const departmentGroups = groupByDepartment(filtered, departmentNames);

    const FILTERS: { key: Task['status'] | 'all'; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'todo', label: 'To Do' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'pending_verification', label: 'Pending Verification' },
        { key: 'done', label: 'Done' },
    ];

    const isEmpty = view === 'board' ? dateFiltered.length === 0 : filtered.length === 0;

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
                    <div className="flex gap-1 p-1 bg-surface-hover/80 border border-border rounded">
                        <button
                            onClick={() => setView('list')}
                            title="List view"
                            aria-label="List view"
                            className={`flex items-center justify-center w-8 h-8 rounded transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                                view === 'list'
                                    ? 'bg-surface text-text ring-1 ring-border/50'
                                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-active/50'
                            }`}
                        >
                            <LayoutList size={16} />
                        </button>
                        <button
                            onClick={() => setView('board')}
                            title="Board view"
                            aria-label="Board view"
                            className={`flex items-center justify-center w-8 h-8 rounded transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                                view === 'board'
                                    ? 'bg-surface text-text ring-1 ring-border/50'
                                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-active/50'
                            }`}
                        >
                            <Kanban size={16} />
                        </button>
                    </div>

                    {!userId && isAdmin && (
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

            {/* List View Filters */}
            {view === 'list' && (
                <div className="flex gap-1 p-1 bg-surface-hover/80 border border-border rounded w-fit overflow-x-auto max-w-full scrollbar-hide">
                    {FILTERS.map(f => {
                        const count = f.key === 'all' ? dateFiltered.length : dateFiltered.filter(t => t.status === f.key).length;
                        const active = filter === f.key;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded transition-all duration-200 cursor-pointer whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                                    active
                                        ? 'bg-surface text-text ring-1 ring-border/50'
                                        : 'text-text-muted hover:text-text-secondary hover:bg-surface-active/50'
                                }`}
                            >
                                {f.label}
                                <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[11px] font-bold rounded-full ${
                                    active ? 'bg-blue-50 text-blue-700' : 'bg-surface-active text-text-light'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

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

            {/* Error State */}
            {isError && (
                <div className="flex items-start gap-3 p-4 bg-danger/10 rounded border border-danger/20 text-danger">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold">Error Loading Tasks</h4>
                        <p className="text-sm mt-1">Failed to connect to the server. Please refresh the page.</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isPending && !isError && isEmpty && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-hover/40 rounded border-2 border-dashed border-border">
                    <div className="flex items-center justify-center w-12 h-12 bg-surface rounded border border-border mb-4">
                        <Inbox size={24} className="text-text-light" />
                    </div>
                    <h3 className="text-lg font-semibold text-text tracking-tight">No tasks found</h3>
                    <p className="text-sm text-text-muted mt-1 max-w-sm">
                        {filter !== 'all' 
                            ? `There are no tasks currently marked as "${FILTERS.find(f => f.key === filter)?.label}".` 
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
                        tasks={dateFiltered}
                        assigneeNames={assigneeNames}
                        departmentNames={departmentNames}
                        isAdmin={isAdmin}
                        isVerifier={isVerifier}
                        onOpen={setSelected}
                    />
                </div>
            )}

            {/* Modals */}
            {showForm && <TaskForm onClose={() => setShowForm(false)} />}
            {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};