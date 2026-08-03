import { Loader2, AlertCircle, Trash2, Clock, User, ImageOff } from "lucide-react";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { PRIORITY_MAP, STATUS_ICON, NEXT_STATUS } from "./taskDisplay";
import { coverPhotoFor } from "./taskAttachmentDisplay";
import { UPLOADS_BASE } from "../../lib/uploadsBase";
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
            className="group flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-3 py-2.5 rounded border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${Math.min(index, 10) * 35}ms`, animationFillMode: 'both' }}
        >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Cover Photo Thumbnail — first image attachment, or a "no photo" placeholder */}
                {coverPhoto ? (
                    <img
                        src={`${UPLOADS_BASE}${coverPhoto.url}`}
                        alt=""
                        className="w-9 h-9 rounded object-cover border border-gray-200 shrink-0"
                    />
                ) : (
                    <div className="flex items-center justify-center w-9 h-9 rounded border border-dashed border-gray-300 bg-gray-50 text-gray-400 shrink-0" title="No photo">
                        <ImageOff size={14} />
                    </div>
                )}

                {/* Status Cycle Button */}
                <button
                    onClick={cycleStatus}
                    disabled={updateMutation.isPending || !next}
                    className={`flex items-center justify-center shrink-0 w-8 h-8 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                        next ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default opacity-60'
                    }`}
                    aria-label={next ? `Move to ${NEXT_STATUS[task.status]}` : 'Current status'}
                    title={next ? `Move to ${NEXT_STATUS[task.status]}` : ''}
                >
                    {updateMutation.isPending
                        ? <Loader2 size={16} className="animate-spin text-gray-400" />
                        : STATUS_ICON[task.status]}
                </button>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <button
                        onClick={() => onOpen(task)}
                        className={`text-[15px] font-semibold truncate text-left transition-colors outline-none focus-visible:text-blue-600 focus-visible:underline ${
                            task.status === 'done'
                                ? 'line-through text-gray-400'
                                : 'text-gray-900 hover:text-blue-600'
                        }`}
                    >
                        {task.title}
                    </button>

                    {/* Meta Info Below Title */}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        {task.dueDate && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                <Clock size={12} className="text-gray-400" />
                                Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}

                        {/* Mobile-only Assignee (moves to right on desktop) */}
                        {assigneeName && (
                            <span className="sm:hidden flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                <User size={12} className="text-gray-400" />
                                <span className="truncate max-w-[8rem]">{assigneeName}</span>
                            </span>
                        )}
                    </div>

                    {/* Inline Error Message */}
                    {updateMutation.isError && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-700 bg-red-50 w-fit px-2 py-0.5 rounded border border-red-200">
                            <AlertCircle size={12} className="text-red-600" />
                            {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update task.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side Actions / Meta */}
            <div className="flex items-center gap-3 sm:shrink-0 pl-11 sm:pl-0">
                {/* Desktop Assignee Badge */}
                {assigneeName && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200 shadow-sm">
                        <User size={12} className="text-gray-400" />
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
                        className="shrink-0 p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
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