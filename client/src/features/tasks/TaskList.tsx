import React, { useState } from "react";
import { Plus, CheckCheck, Clock, Circle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../components";
import { useTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import type { Task } from '../../api/task';
import { TaskForm } from "./TaskForm";

const PRIORITY_MAP = {
    low:    { label: 'Low',    className: 'bg-slate-100 text-slate-500' },
    medium: { label: 'Medium', className: 'bg-amber-50  text-amber-600' },
    high:   { label: 'High',   className: 'bg-red-50    text-red-500'   },
} satisfies Record<Task['priority'], { label: string; className: string }>;

const STATUS_ICON = {
    todo:        <Circle     size={15} className="text-slate-400"  />,
    in_progress: <Clock      size={15} className="text-amber-500"  />,
    done:        <CheckCheck size={15} className="text-emerald-500" />,
} satisfies Record<Task['status'], React.ReactNode>;

const TaskRow = ({ task }: { task: Task }) => {
    const updateMutation = useUpdateTaskMutation();
    const deleteMutation = useDeleteTaskMutation();

    const cycleStatus = () => {
        const next: Record<Task['status'], Task['status']> = {
            todo:        'in_progress',
            in_progress: 'done',
            done:        'todo',
        };
        updateMutation.mutate({ id: task.id, payload: { status: next[task.status] } });
    };

    const priority = PRIORITY_MAP[task.priority];

    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200/70 bg-white hover:border-slate-300 transition-colors group">
            <button
                onClick={cycleStatus}
                disabled={updateMutation.isPending}
                className="shrink-0 cursor-pointer disabled:opacity-50"
                aria-label="Cycle status"
            >
                {updateMutation.isPending
                    ? <Loader2 size={15} className="animate-spin text-slate-400" />
                    : STATUS_ICON[task.status]}
            </button>

            <div className="flex-1 min-w-0">
                <p className={[
                    'text-sm font-display font-medium truncate',
                    task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800',
                ].join(' ')}>
                    {task.title}
                </p>
                {task.dueDate && (
                    <p className="text-xs text-slate-400 mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                )}
            </div>

            <span className={[
                'text-xs font-display font-medium px-2 py-0.5 rounded-full shrink-0',
                priority.className,
            ].join(' ')}>
                {priority.label}
            </span>

            <button
                onClick={() => deleteMutation.mutate(task.id)}
                disabled={deleteMutation.isPending}
                className="shrink-0 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50"
                aria-label="Delete task"
            >
                {deleteMutation.isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <AlertCircle size={14} />}
            </button>
        </div>
    );
};

export const TaskList = () => {
    const [showForm, setShowForm] = useState(false);
    const { data: tasks, isPending, isError } = useTasksQuery();
    const [filter, setFilter] = useState<Task['status'] | 'all'>('all');

    const filtered = filter === 'all'
        ? (tasks ?? [])
        : (tasks ?? []).filter(t => t.status === filter);

    const FILTERS: { key: Task['status'] | 'all'; label: string }[] = [
        { key: 'all',         label: 'All'         },
        { key: 'todo',        label: 'To Do'        },
        { key: 'in_progress', label: 'In Progress'  },
        { key: 'done',        label: 'Done'         },
    ];

    return (
        <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-display font-semibold text-slate-900">Tasks</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {tasks?.length ?? 0} task{tasks?.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="primary"
                    className="gap-1.5"
                    onClick={() => setShowForm(true)}
                >
                    <Plus size={14} />
                    New task
                </Button>
            </div>

            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={[
                            'px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer',
                            filter === f.key
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700',
                        ].join(' ')}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isPending && (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    <span className="text-sm font-display">Loading tasks…</span>
                </div>
            )}

            {isError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-500 text-sm font-display">
                    <AlertCircle size={15} />
                    Failed to load tasks. Please refresh.
                </div>
            )}

            {!isPending && !isError && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <CheckCheck size={28} className="text-slate-300" />
                    <p className="text-sm font-display">No tasks here.</p>
                </div>
            )}

            {!isPending && !isError && filtered.length > 0 && (
                <div className="flex flex-col gap-2">
                    {filtered.map(task => (
                        <TaskRow key={task.id} task={task} />
                    ))}
                </div>
            )}

            {showForm && <TaskForm onClose={() => setShowForm(false)} />}
        </div>
    );
};
