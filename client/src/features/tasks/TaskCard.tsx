import {
  ChevronRight,
  Loader2,
  Trash2,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldQuestion,
} from "lucide-react";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { TaskVerifyActions } from "./TaskVerifyActions";
import { PRIORITY_MAP, STATUS_LABEL, NEXT_STATUS } from "./taskDisplay";
import { getInitials } from "../../lib/getInitials";
import type { Task } from "../../api/task";

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  isAdmin: boolean;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
  index?: number;
}

export const TaskCard = ({ task, assigneeName, isAdmin, isVerifier, onOpen, index = 0 }: TaskCardProps) => {
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();
  const priority = PRIORITY_MAP[task.priority];
  const next = NEXT_STATUS[task.status];

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const advance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (next) {
      updateMutation.mutate({ id: task.id, payload: { status: next } });
    }
  };

  return (
    <div
      onClick={() => onOpen(task)}
      className="group relative flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-surface/80 hover:bg-surface hover:border-primary-500/40 hover:shadow-md hover:shadow-primary-500/5 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 select-none"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms`, animationFillMode: 'both' }}
    >
      <div>
        {/* Top Row: Priority Badge & Admin Delete Action */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {priority ? (
            <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs transition-colors ${priority.className}`}>
              <span className="size-1.5 rounded-full bg-current shrink-0 animate-pulse" />
              {priority.label}
            </span>
          ) : (
            <div />
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(task.id);
              }}
              disabled={deleteMutation.isPending}
              className="shrink-0 p-1.5 -mr-1 -mt-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer disabled:opacity-50"
              aria-label="Delete task"
              title="Delete task"
            >
              {deleteMutation.isPending ? (
                <Loader2 size={14} className="animate-spin text-danger" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-mono font-medium text-text group-hover:text-primary-600 transition-colors line-clamp-2 leading-relaxed mb-3">
          {task.title}
        </h4>
      </div>

      <div>
        {/* Meta Row: Due Date & Assignee Avatar */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          {task.dueDate ? (
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md ${isOverdue ? 'bg-danger/10 text-danger border border-danger/20' : 'text-text-muted bg-surface-hover/50'}`}>
              <Clock size={12} className={isOverdue ? 'text-danger' : 'text-text-muted'} />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              {isOverdue && <span className="text-[9px] uppercase tracking-wider font-bold">Overdue</span>}
            </div>
          ) : (
            <div />
          )}

          {assigneeName ? (
            <div
              className="flex items-center justify-center size-6.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-[10px] font-semibold shrink-0 shadow-xs ring-2 ring-surface group-hover:ring-primary-500/20 transition-all"
              title={`Assigned to ${assigneeName}`}
            >
              {getInitials(assigneeName)}
            </div>
          ) : (
            <div className="flex items-center justify-center size-6.5 rounded-full border border-dashed border-border text-text-muted shrink-0 hover:border-border-hover" title="Unassigned">
              <User size={12} />
            </div>
          )}
        </div>

        {/* Mutation Error Feedback */}
        {updateMutation.isError && (
          <div className="mt-2.5 p-2 bg-danger/10 rounded-lg text-[11px] text-danger font-medium border border-danger/20">
            {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update task.'}
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="pt-2.5 mt-3 border-t border-border/50">
          {next ? (
            <button
              type="button"
              onClick={advance}
              disabled={updateMutation.isPending}
              className="flex items-center justify-between w-full py-1 px-1.5 -mx-1.5 rounded-md text-xs font-medium text-text-muted hover:text-primary-600 hover:bg-primary-500/5 transition-all group/btn disabled:opacity-50 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 truncate">
                {updateMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin text-primary-500" />
                ) : (
                  <ChevronRight size={13} className="text-text-muted group-hover/btn:text-primary-600 transition-colors" />
                )}
                <span>Move to <strong className="font-semibold">{STATUS_LABEL[next]}</strong></span>
              </span>
              <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all shrink-0 text-primary-600" />
            </button>
          ) : task.status === 'pending_verification' ? (
            isVerifier ? (
              <TaskVerifyActions task={task} />
            ) : (
              <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20">
                <ShieldQuestion size={13} />
                <span>Awaiting verification</span>
              </div>
            )
          ) : (
            <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>Task Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};