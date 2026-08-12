import { Loader2, AlertCircle, Trash2, Clock, User, ImageOff } from "lucide-react";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { PRIORITY_MAP, STATUS_ICON, NEXT_STATUS } from "./taskDisplay";
import { coverPhotoFor } from "./taskAttachmentDisplay";
import { UPLOADS_BASE } from "../../lib/uploadsBase";
import { TaskSourceBadge } from "./TaskSourceBadge";
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

    const next = NEXT_STATUS[task.status];

    const cycleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!next) return; // done/pending_verification have no self-service next step
        updateMutation.mutate({ id: task.id, payload: { status: next } });
    };

    const priority = PRIORITY_MAP[task.priority];
    const coverPhoto = coverPhotoFor(task.attachments);

    return (
        <div
            className="group flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-3 py-2.5 rounded border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${Math.min(index, 10) * 35}ms`, animationFillMode: 'both' }}
        >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {coverPhoto ? (
                    <img
                        src={`${UPLOADS_BASE}${coverPhoto.url}`}
                        alt=""
                        className="w-9 h-9 rounded object-cover border border-border shrink-0"
                    />
                ) : (
                    <div className="flex items-center justify-center w-9 h-9 rounded border border-dashed border-border-hover bg-surface-hover text-text-light shrink-0" title="No photo">
                        <ImageOff size={14} />
                    </div>
                )}

                <button
                    onClick={cycleStatus}
                    disabled={updateMutation.isPending || !next}
                    className={`flex items-center justify-center shrink-0 w-8 h-8 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                        next ? 'cursor-pointer hover:bg-surface-hover' : 'cursor-default opacity-60'
                    }`}
                    aria-label={next ? `Move to ${NEXT_STATUS[task.status]}` : 'Current status'}
                    title={next ? `Move to ${NEXT_STATUS[task.status]}` : ''}
                >
                    {updateMutation.isPending
                        ? <Loader2 size={16} className="animate-spin text-text-light" />
                        : STATUS_ICON[task.status]}
                </button>

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <button
                        onClick={() => onOpen(task)}
                        className={`text-[15px] font-semibold truncate text-left transition-colors outline-none focus-visible:text-blue-600 focus-visible:underline ${
                            task.status === 'done'
                                ? 'line-through text-text-light'
                                : 'text-text hover:text-blue-600'
                        }`}
                    >
                        {task.title}
                    </button>
                    <TaskSourceBadge aiMeta={task.aiMeta}/>

                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        {task.dueDate && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                                <Clock size={12} className="text-text-light" />
                                Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}

                        {/* Mobile-only Assignee (moves to right on desktop) */}
                        {assigneeName && (
                            <span className="sm:hidden flex items-center gap-1.5 text-xs font-medium text-text-muted">
                                <User size={12} className="text-text-light" />
                                <span className="truncate max-w-[8rem]">{assigneeName}</span>
                            </span>
                        )}
                    </div>

                    {/* Inline Error Message */}
                    {updateMutation.isError && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-danger bg-danger/10 w-fit px-2 py-0.5 rounded border border-danger/20">
                            <AlertCircle size={12} className="text-danger" />
                            {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update task.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side Actions / Meta */}
            <div className="flex items-center gap-3 sm:shrink-0 pl-11 sm:pl-0">
                {/* Desktop Assignee Badge */}
                {assigneeName && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-hover px-2 py-1 rounded border border-border shadow-sm">
                        <User size={12} className="text-text-light" />
                        <span className="truncate max-w-[8rem]">{assigneeName}</span>
                    </div>
                )}

                <span className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold px-2 py-1 rounded border shrink-0 shadow-sm ${priority.className}`}>
                    <span className={`size-1.5 rounded-full shrink-0 ${priority.accent}`} />
                    {priority.label}
                </span>

                {isAdmin && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(task.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="shrink-0 p-1.5 rounded text-text-light hover:text-danger hover:bg-danger/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                        aria-label="Delete task"
                        title="Delete task"
                    >
                        {deleteMutation.isPending
                            ? <Loader2 size={16} className="animate-spin text-red-600" />
                            : <Trash2 size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};