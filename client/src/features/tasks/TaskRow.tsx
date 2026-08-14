import { Loader2, AlertCircle, Trash2, Clock, User, ListChecks, CalendarPlus, History, MoreVertical, SquarePen } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { PRIORITY_MAP, STATUS_ICON, NEXT_STATUS } from "./taskDisplay";
import { departmentTagClass } from "./departmentTagColors";
import { coverPhotoFor } from "./taskAttachmentDisplay";
import { UPLOADS_BASE } from "../../lib/uploadsBase";
import { TaskSourceBadge } from "./TaskSourceBadge";
import { CATEGORY_CONFIG, subtaskProgress, formatShortDateTime, type CardFieldVisibility } from "./cardFields";
import type { Task } from '../../api/task';

interface TaskRowProps {
    task: Task;
    assigneeName?: string;
    departmentName?: string;
    isVerifier: boolean;
    onOpen: (task: Task) => void;
    index?: number;
    fields: CardFieldVisibility;
}

export const TaskRow = ({ task, assigneeName, departmentName, isVerifier, onOpen, index = 0, fields }: TaskRowProps) => {
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
    const subtasks = subtaskProgress(task);

    return (
        <div
            className="group flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-3 py-2.5 rounded-lg bg-surface hover:shadow-sm transition-shadow duration-200 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${Math.min(index, 10) * 35}ms`, animationFillMode: 'both' }}
        >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {coverPhoto && (
                        <img
                            src={`${UPLOADS_BASE}${coverPhoto.url}`}
                            alt=""
                            className="w-9 h-9 rounded object-cover border border-border shrink-0"
                        />
                    )}

                    <button
                        onClick={cycleStatus}
                        disabled={updateMutation.isPending || !next}
                        className={`flex items-center justify-center shrink-0 w-8 h-8 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
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
                        <div className="flex items-center gap-1.5 min-w-0">
                            <button
                                onClick={() => onOpen(task)}
                                className={`text-[15px] font-semibold truncate text-left transition-colors outline-none focus-visible:text-primary-600 focus-visible:underline ${
                                    task.status === 'done'
                                        ? 'line-through text-text-light'
                                        : 'text-text hover:text-primary-600'
                                }`}
                            >
                                {task.title}
                            </button>
                            <TaskSourceBadge aiMeta={task.aiMeta}/>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {fields.dueDate && task.dueDate && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                                    <Clock size={13} strokeWidth={2.5} className="text-text-light" />
                                    Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}

                            {fields.subtasks && subtasks && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                                    <ListChecks size={13} strokeWidth={2.5} className="text-text-light" />
                                    {subtasks.done}/{subtasks.total}
                                </span>
                            )}

                            {fields.category && (() => {
                                const cat = CATEGORY_CONFIG[task.category];
                                return (
                                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${cat.className}`}>
                                        <cat.icon size={12} strokeWidth={2.5} />
                                        {cat.label}
                                    </span>
                                );
                            })()}

                            {fields.created && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-text-light" title={`Created ${formatShortDateTime(task.createdAt)}`}>
                                    <CalendarPlus size={13} strokeWidth={2.5} className="text-text-light" />
                                    {formatShortDateTime(task.createdAt)}
                                </span>
                            )}

                            {fields.updated && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-text-light" title={`Updated ${formatShortDateTime(task.updatedAt)}`}>
                                    <History size={13} strokeWidth={2.5} className="text-text-light" />
                                    {formatShortDateTime(task.updatedAt)}
                                </span>
                            )}

                            {/* Mobile-only Assignee (moves to right on desktop) */}
                            {fields.assignee && assigneeName && (
                                <span className="sm:hidden flex items-center gap-1.5 text-xs font-medium text-text-muted">
                                    <User size={13} strokeWidth={2.5} className="text-text-light" />
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
                <div className="flex items-center gap-2.5 sm:shrink-0 pl-11 sm:pl-0">
                    {/* Desktop Assignee */}
                    {fields.assignee && assigneeName && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-text-secondary shrink-0">
                            <User size={13} strokeWidth={2.5} className="text-text-light" />
                            <span className="truncate max-w-[8rem]">{assigneeName}</span>
                        </div>
                    )}

                    {fields.department && departmentName && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold shrink-0 ${departmentTagClass(departmentName)}`}>
                            {departmentName}
                        </span>
                    )}

                    {fields.priority && (
                        <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${priority.className}`}>
                            <span className={`size-1.5 rounded-full shrink-0 ${priority.accent}`} />
                            {priority.label}
                        </span>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                disabled={deleteMutation.isPending}
                                className="shrink-0 p-1.5 rounded text-text-light hover:text-text hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
                                aria-label="Task actions"
                                title="Task actions"
                            >
                                {deleteMutation.isPending
                                    ? <Loader2 size={17} strokeWidth={2.5} className="animate-spin text-danger" />
                                    : <MoreVertical size={17} strokeWidth={2.5} />}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => onOpen(task)} className="gap-2">
                                <SquarePen size={14} className="text-text-light" />
                                Edit
                            </DropdownMenuItem>
                            {isVerifier && (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(task.id)}
                                    className="gap-2"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
        </div>
    );
};
