import React, { useState } from "react";
import { Plus, CheckCheck, Clock, Circle, AlertCircle, Loader2, LayoutList, Kanban } from "lucide-react";
import { Button } from "../../components";
import { useTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation, useAssignableUsersQuery } from "./hook";
import type { Task } from '../../api/task';
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";
import { TaskBoard } from "./TaskBoard";
import { useAuth } from "../../context/AuthContext"

export const PRIORITY_MAP = {
    low: { label: 'Low', className: 'bg-surface-hover text-text-muted' },
    medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    high: { label: 'High', className: 'bg-danger/10 text-danger' },
} satisfies Record<Task['priority'], { label: string; className: string }>;

export const STATUS_ICON = {
    todo: <Circle size={15} className="text-text-light" />,
    in_progress: <Clock size={15} className="text-amber-500" />,
    done: <CheckCheck size={15} className="text-emerald-500" />,
} satisfies Record<Task['status'], React.ReactNode>;

export const STATUS_LABEL = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
} satisfies Record<Task['status'], string>;

export const NEXT_STATUS: Record<Task['status'], Task['status']> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
};

// NEW: accepts an optional assigneeName to display, resolved by the parent TaskList
// (see userMap below) since the API only ever gives us a bare assigneeId, not a full user object.
const TaskRow = ({ task, assigneeName, isAdmin, onOpen }: { task: Task; assigneeName?: string, isAdmin: boolean, onOpen: (task: Task) => void }) => {
    const updateMutation = useUpdateTaskMutation();
    const deleteMutation = useDeleteTaskMutation();

    const cycleStatus = () => {
        updateMutation.mutate({ id: task.id, payload: { status: NEXT_STATUS[task.status] } });
    };

    const priority = PRIORITY_MAP[task.priority];

    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-hover transition-colors group">
            <button
                onClick={cycleStatus}
                disabled={updateMutation.isPending}
                className="shrink-0 cursor-pointer disabled:opacity-50"
                aria-label="Cycle status"
            >
                {updateMutation.isPending
                    ? <Loader2 size={15} className="animate-spin text-text-light" />
                    : STATUS_ICON[task.status]}
            </button>

            <div className="flex-1 min-w-0">
                <button
                    onClick={() => onOpen(task)}
                    className={[
                        'text-sm font-display font-medium truncate text-left cursor-pointer hover:underline',
                        task.status === 'done' ? 'line-through text-text-muted' : 'text-text',
                    ].join(' ')}
                >
                    {task.title}
                </button>
                {task.dueDate && (
                    <p className="text-xs text-text-muted mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                )}
                {updateMutation.isError && (
                    <p className="text-xs text-danger mt-0.5">
                        {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update task.'}
                    </p>
                )}
            </div>

            {/* NEW — only rendered when this task is actually assigned to someone */}
            {assigneeName && (
                <span className="text-xs text-text-muted font-display shrink-0 truncate max-w-[8rem]">
                    → {assigneeName}
                </span>
            )}

            <span className={[
                'text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0',
                priority.className,
            ].join(' ')}>
                {priority.label}
            </span>

            {
                isAdmin && (
                    <Button
                        onClick={() => deleteMutation.mutate(task.id)}
                        disabled={deleteMutation.isPending}
                        className="shrink-0 text-text-light hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50"
                        aria-label="Delete task"
                    >
                        {deleteMutation.isPending
                            ? <Loader2 size={14} className="animate-spin" />
                            : <AlertCircle size={14} />}
                    </Button>
                )
            }
        </div>
    );
};

interface TaskListProps {
    userId?: string;
}

export const TaskList = ({ userId }: TaskListProps = {}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Task | null>(null);
    const { data: tasks, isPending, isError } = useTasksQuery(userId);
    const { data: assignableUsers } = useAssignableUsersQuery(); // NEW
    const [filter, setFilter] = useState<Task['status'] | 'all'>('all');
    const [view, setView] = useState<'list' | 'board'>('board');

    const assigneeNames = new Map(
        (assignableUsers ?? []).map(u => [u.id, `${u.firstName} ${u.lastName ?? ''}`.trim()]),
    );

    const filtered = filter === 'all'
        ? (tasks ?? [])
        : (tasks ?? []).filter(t => t.status === filter);

    const FILTERS: { key: Task['status'] | 'all'; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'todo', label: 'To Do' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'done', label: 'Done' },
    ];

    const isEmpty = view === 'board' ? (tasks ?? []).length === 0 : filtered.length === 0;

    return (
        <div className={['flex flex-col gap-6', view === 'board' ? 'max-w-6xl' : 'max-w-3xl'].join(' ')}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-display font-semibold text-text">Tasks</h1>
                    <p className="text-sm text-text-muted mt-0.5">
                        {tasks?.length ?? 0} task{tasks?.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View switcher — board groups by status, list keeps the filter tabs below */}
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
                                'px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
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

            {isPending && (
                <div className="flex items-center justify-center py-16 text-text-muted">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    <span className="text-sm font-display">Loading tasks…</span>
                </div>
            )}

            {isError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
                    <AlertCircle size={15} />
                    Failed to load tasks. Please refresh.
                </div>
            )}

            {!isPending && !isError && isEmpty && (
                <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
                    <CheckCheck size={28} className="text-text-light" />
                    <p className="text-sm font-display">No tasks here.</p>
                </div>
            )}

            {!isPending && !isError && !isEmpty && view === 'list' && (
                <div className="flex flex-col gap-2">
                    {filtered.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            isAdmin={isAdmin}
                            onOpen={setSelected}
                            assigneeName={task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined}
                        />
                    ))}
                </div>
            )}

            {!isPending && !isError && !isEmpty && view === 'board' && (
                <TaskBoard
                    tasks={tasks ?? []}
                    assigneeNames={assigneeNames}
                    isAdmin={isAdmin}
                    onOpen={setSelected}
                />
            )}

            {showForm && <TaskForm onClose={() => setShowForm(false)} />}
            {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};
