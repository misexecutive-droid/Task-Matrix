import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "../../components";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { PRIORITY_MAP, STATUS_ICON, STATUS_LABEL, NEXT_STATUS } from "./TaskList";
import type { Task } from "../../api/task";

const COLUMNS: Task['status'][] = ['todo', 'in_progress', 'done'];

interface TaskBoardCardProps {
    task: Task;
    assigneeName?: string;
    isAdmin: boolean;
    onOpen: (task: Task) => void;
}

const TaskBoardCard = ({ task, assigneeName, isAdmin, onOpen }: TaskBoardCardProps) => {
    const updateMutation = useUpdateTaskMutation();
    const deleteMutation = useDeleteTaskMutation();
    const priority = PRIORITY_MAP[task.priority];
    const next = NEXT_STATUS[task.status];

    const advance = () => updateMutation.mutate({ id: task.id, payload: { status: next } });

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between gap-2">
                <button
                    onClick={() => onOpen(task)}
                    className="text-sm font-display font-medium text-text text-left cursor-pointer hover:underline line-clamp-2"
                >
                    {task.title}
                </button>
                {isAdmin && (
                    <Button
                        onClick={() => deleteMutation.mutate(task.id)}
                        disabled={deleteMutation.isPending}
                        className="shrink-0 text-text-light hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50"
                        aria-label="Delete task"
                    >
                        {deleteMutation.isPending
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[11px] font-display font-medium px-2 py-0.5 rounded-full ${priority.className}`}>
                    {priority.label}
                </span>
                {assigneeName && (
                    <span className="text-[11px] text-text-muted font-display truncate max-w-[8rem]">
                        → {assigneeName}
                    </span>
                )}
            </div>

            {task.dueDate && (
                <p className="text-[11px] text-text-muted font-display">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                </p>
            )}

            {updateMutation.isError && (
                <p className="text-[11px] text-danger font-display">
                    {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update.'}
                </p>
            )}

            <button
                onClick={advance}
                disabled={updateMutation.isPending}
                className="mt-1 self-start flex items-center gap-1 text-[11px] font-display font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer disabled:opacity-50 transition-colors"
            >
                {updateMutation.isPending
                    ? <Loader2 size={11} className="animate-spin" />
                    : <ChevronRight size={11} />}
                Move to {STATUS_LABEL[next]}
            </button>
        </div>
    );
};

interface TaskBoardProps {
    tasks: Task[];
    assigneeNames: Map<string, string>;
    isAdmin: boolean;
    onOpen: (task: Task) => void;
}

export const TaskBoard = ({ tasks, assigneeNames, isAdmin, onOpen }: TaskBoardProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {COLUMNS.map(status => {
                const columnTasks = tasks.filter(t => t.status === status);
                return (
                    <div key={status} className="flex flex-col gap-3 min-w-0">
                        <div className="flex items-center gap-2 px-1">
                            {STATUS_ICON[status]}
                            <h3 className="text-sm font-display font-semibold text-text">
                                {STATUS_LABEL[status]}
                            </h3>
                            <span className="ml-auto text-xs font-display text-text-muted bg-surface-hover rounded-full px-2 py-0.5">
                                {columnTasks.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {columnTasks.length === 0 ? (
                                <div className="flex items-center justify-center py-8 text-xs text-text-light font-display border border-dashed border-border rounded-lg">
                                    No tasks
                                </div>
                            ) : (
                                columnTasks.map(task => (
                                    <TaskBoardCard
                                        key={task.id}
                                        task={task}
                                        isAdmin={isAdmin}
                                        onOpen={onOpen}
                                        assigneeName={task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};