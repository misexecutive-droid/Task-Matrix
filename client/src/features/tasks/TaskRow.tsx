import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "../../components";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { PRIORITY_MAP, STATUS_ICON, NEXT_STATUS } from "./TaskList";
import type { Task } from '../../api/task';

interface TaskRowProps {
    task: Task;
    assigneeName?: string;
    isAdmin: boolean;
    onOpen: (task: Task) => void;
    index?: number;
}

export const TaskRow = ({ task, assigneeName, isAdmin, onOpen, index = 0 }: TaskRowProps) => {
    const updateMutation = useUpdateTaskMutation();
    const deleteMutation = useDeleteTaskMutation();

    const cycleStatus = () => {
        updateMutation.mutate({ id: task.id, payload: { status: NEXT_STATUS[task.status] } });
    };

    const priority = PRIORITY_MAP[task.priority];

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all group animate-step-in"
            style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
        >
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
                        'text-sm font-mono font-medium truncate text-left cursor-pointer hover:underline',
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

            {/* Only rendered when this task is actually assigned to someone */}
            {assigneeName && (
                <span className="text-xs text-text-muted font-mono shrink-0 truncate max-w-[8rem]">
                    → {assigneeName}
                </span>
            )}

            <span className={[
                'flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-0.5 rounded-full shrink-0',
                priority.className,
            ].join(' ')}>
                <span className={`size-1.5 rounded-full shrink-0 ${priority.accent}`} />
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
