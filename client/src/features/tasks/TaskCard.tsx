import {
  ChevronRight,
  Loader2,
  Trash2,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldQuestion,
  AlertCircle,
} from "lucide-react";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { TaskVerifyActions } from "./TaskVerifyActions";
import { PRIORITY_MAP, STATUS_LABEL, NEXT_STATUS } from "./taskDisplay";
import { departmentTagClass } from "./departmentTagColors";
import { coverPhotoFor } from "./taskAttachmentDisplay";
import { getInitials } from "../../lib/getInitials";
import { UPLOADS_BASE } from "../../lib/uploadsBase";
import type { Task } from "../../api/task";

interface TaskCardProps {
  task: Task;
  assigneeName?: string;
  departmentName?: string;
  isAdmin: boolean;
  isVerifier: boolean;
  onOpen: (task: Task) => void;
  index?: number;
}

export const TaskCard = ({ task, assigneeName, departmentName, isAdmin, isVerifier, onOpen, index = 0 }: TaskCardProps) => {
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();
  const priority = PRIORITY_MAP[task.priority];
  const next = NEXT_STATUS[task.status];
  const coverPhoto = coverPhotoFor(task.attachments);

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
      // Media-card pattern: image bleeds edge-to-edge, content sits in padded sections below
      className="group relative flex flex-col justify-between rounded overflow-hidden border border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 select-none"
    >
      <div>
        {/* Cover Photo — full-bleed, only rendered when one exists so photo-less cards stay compact */}
        {coverPhoto && (
          <img
            src={`${UPLOADS_BASE}${coverPhoto.url}`}
            alt=""
            className="w-full h-32 object-cover"
          />
        )}

        <div className="px-4 pt-4 flex items-center justify-between gap-2 mb-3">
          {priority ? (
            <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${priority.className}`}>
              <span className="size-1.5 rounded-full bg-current shrink-0" />
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
              className="shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              aria-label="Delete task"
              title="Delete task"
            >
              {deleteMutation.isPending ? (
                <Loader2 size={16} className="animate-spin text-red-600" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>

        {/* Task Title */}
        <h4 className="px-4 text-[15px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3">
          {task.title}
        </h4>

        {departmentName && (
          <span className={`mx-4 inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full border mb-1 ${departmentTagClass(departmentName)}`}>
            {departmentName}
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Meta Row: Due Date & Assignee Avatar */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          {task.dueDate ? (
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border ${
              isOverdue
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              <Clock size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              {isOverdue && <span className="text-[9px] uppercase tracking-wider font-bold text-red-600 ml-0.5">Overdue</span>}
            </div>
          ) : (
            <div />
          )}

          {assigneeName ? (
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold shrink-0 ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all"
              title={`Assigned to ${assigneeName}`}
            >
              {getInitials(assigneeName)}
            </div>
          ) : (
            <div className="flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-400 shrink-0 hover:border-gray-400 bg-gray-50" title="Unassigned">
              <User size={14} />
            </div>
          )}
        </div>

        {/* Mutation Error Feedback */}
        {updateMutation.isError && (
          <div className="flex items-start gap-2 mt-3 p-2 bg-red-50 rounded text-xs text-red-700 font-medium border border-red-100">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
            <span>{updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update task.'}</span>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="pt-3 mt-4 border-t border-gray-100">
          {next ? (
            <button
              type="button"
              onClick={advance}
              disabled={updateMutation.isPending}
              className="flex items-center justify-between w-full py-1.5 px-2 -mx-2 rounded text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all group/btn disabled:opacity-50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
            >
              <span className="flex items-center gap-1.5 truncate">
                {updateMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400 group-hover/btn:text-blue-600 transition-colors" />
                )}
                <span>Move to <strong className="font-bold">{STATUS_LABEL[next]}</strong></span>
              </span>
              <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all shrink-0 text-blue-600" />
            </button>
          ) : task.status === 'pending_verification' ? (
            isVerifier ? (
              <TaskVerifyActions task={task} />
            ) : (
              <div className="flex items-center justify-center w-full gap-1.5 py-1.5 rounded text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                <ShieldQuestion size={14} className="text-amber-500" />
                <span>Awaiting verification</span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center w-full gap-1.5 py-1.5 rounded text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Task Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};