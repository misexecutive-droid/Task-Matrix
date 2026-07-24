import React, { useState } from "react";
import { Plus, CheckCheck, Clock, Circle, AlertCircle, LayoutList, Kanban, ShieldQuestion } from "lucide-react";
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

export const PRIORITY_MAP = {
    low: { label: 'Low', className: 'bg-surface-hover text-text-muted', accent: 'bg-text-light' },
    medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', accent: 'bg-amber-500' },
    high: { label: 'High', className: 'bg-danger/10 text-danger', accent: 'bg-danger' },
} satisfies Record<Task['priority'], { label: string; className: string; accent: string }>;

export const STATUS_ICON = {
    todo: <Circle size={15} className="text-text-light" />,
    in_progress: <Clock size={15} className="text-amber-500" />,
    pending_verification: <ShieldQuestion size={15} className="text-indigo-500" />,
    done: <CheckCheck size={15} className="text-emerald-500" />,
} satisfies Record<Task['status'], React.ReactNode>;

export const STATUS_LABEL = {
    todo: 'To Do',
    in_progress: 'In Progress',
    pending_verification: 'Pending Verification',
    done: 'Done',
} satisfies Record<Task['status'], string>;

// A task's next step, or null once it's out of the assignee's hands — pending_verification
// waits on a PC/Admin (see the verify buttons on TaskBoard/TaskDetail), done is terminal.
export const NEXT_STATUS: Record<Task['status'], Task['status'] | null> = {
    todo: 'in_progress',
    in_progress: 'pending_verification',
    pending_verification: null,
    done: null,
};

interface TaskListProps {
    userId?: string;
    hideHeader?: boolean;
}

export const TaskList = ({ userId, hideHeader = false }: TaskListProps = {}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isVerifier = user?.role === "PC" || user?.role === "ADMIN";
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Task | null>(null);
    const { data: tasks, isPending, isError } = useTasksQuery(userId);
    const { data: assignableUsers } = useAssignableUsersQuery(); // NEW
    const { data: departments } = useDepartmentsQuery();
    const [filter, setFilter] = useState<Task['status'] | 'all'>('all');
    const [view, setView] = useState<'list' | 'board'>('board');

    const assigneeNames = new Map(
        (assignableUsers ?? []).map(u => [u.id, `${u.firstName} ${u.lastName ?? ''}`.trim()]),
    );
    const departmentNames = new Map((departments ?? []).map(d => [d.id, d.name]));

    const filtered = filter === 'all'
        ? (tasks ?? [])
        : (tasks ?? []).filter(t => t.status === filter);

    const departmentGroups = groupByDepartment(filtered, departmentNames);

    const FILTERS: { key: Task['status'] | 'all'; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'todo', label: 'To Do' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'pending_verification', label: 'Pending Verification' },
        { key: 'done', label: 'Done' },
    ];

    const isEmpty = view === 'board' ? (tasks ?? []).length === 0 : filtered.length === 0;

    return (
        <div className={['flex flex-col gap-6', view === 'board' ? 'max-w-6xl' : 'max-w-3xl'].join(' ')}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                {!hideHeader && (
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
                            <CheckCheck size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-mono font-semibold text-text">Tasks</h1>
                            <p className="text-sm text-text-muted mt-0.5">
                                {tasks?.length ?? 0} task{tasks?.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                )}

                <div className={['flex items-center gap-2', hideHeader ? 'ml-auto' : ''].join(' ')}>
                    <div className="flex gap-1 p-1 bg-surface-hover rounded-lg">
                        <button
                            onClick={() => setView('list')}
                            title="List view"
                            aria-label="List view"
                            className={[
                                'flex items-center justify-center size-7 rounded-md transition-colors cursor-pointer',
                                view === 'list' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text-secondary',
                            ].join(' ')}
                        >
                            <LayoutList size={14} />
                        </button>
                        <button
                            onClick={() => setView('board')}
                            title="Board view"
                            aria-label="Board view"
                            className={[
                                'flex items-center justify-center size-7 rounded-md transition-colors cursor-pointer',
                                view === 'board' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text-secondary',
                            ].join(' ')}
                        >
                            <Kanban size={14} />
                        </button>
                    </div>

                    {!userId && isAdmin && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="gap-1.5"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={14} />
                            New task
                        </Button>
                    )}
                </div>
            </div>

            {view === 'list' && (
                <div className="flex gap-1 p-1 bg-surface-hover rounded-lg w-fit overflow-x-auto max-w-full">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={[
                                'px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
                                filter === f.key
                                    ? 'bg-surface text-text shadow-sm'
                                    : 'text-text-muted hover:text-text-secondary',
                            ].join(' ')}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {isPending && view === 'list' && (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface">
                            <Skeleton className="size-4 rounded-full shrink-0" />
                            <Skeleton className="h-4 flex-1 max-w-64" />
                            <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {isPending && view === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {Array.from({ length: 3 }).map((_, col) => (
                        <div key={col} className="flex flex-col gap-3">
                            <Skeleton className="h-5 w-24" />
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-surface">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/3 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono">
                    <AlertCircle size={15} />
                    Failed to load tasks. Please refresh.
                </div>
            )}

            {!isPending && !isError && isEmpty && (
                <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
                    <CheckCheck size={28} className="text-text-light" />
                    <p className="text-sm font-mono">No tasks here.</p>
                </div>
            )}

            {!isPending && !isError && !isEmpty && view === 'list' && (() => {
                let rowIndex = 0;
                return (
                    <div className="flex flex-col gap-5">
                        {departmentGroups.map(group => (
                            <div key={group.departmentId ?? '__none__'} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wide">
                                        {group.departmentName}
                                    </h3>
                                    <span className="text-xs text-text-light font-mono">{group.tasks.length}</span>
                                </div>
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
                        ))}
                    </div>
                );
            })()}

            {!isPending && !isError && !isEmpty && view === 'board' && (
                <TaskBoard
                    tasks={tasks ?? []}
                    assigneeNames={assigneeNames}
                    isAdmin={isAdmin}
                    isVerifier={isVerifier}
                    onOpen={setSelected}
                />
            )}

            {showForm && <TaskForm onClose={() => setShowForm(false)} />}
            {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};
