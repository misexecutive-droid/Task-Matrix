import {
  Loader2,
  Trash2,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldQuestion,
  AlertCircle,
} from "lucide-react";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "./hook";
import { TaskVerifyActions } from "./TaskVerifyActions";
import { PRIORITY_MAP, STATUS_LABEL, NEXT_STATUS, PREV_STATUS } from "./taskDisplay";
import { departmentTagClass } from "./departmentTagColors";
import { TaskSourceBadge } from "./TaskSourceBadge";
import { getInitials } from "../../lib/getInitials";
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

export const TaskCard = ({ task, assigneeName, departmentName, isAdmin, isVerifier, onOpen }: TaskCardProps) => {
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();
  const priority = PRIORITY_MAP[task.priority];
  const next = NEXT_STATUS[task.status];
  const prev = PREV_STATUS[task.status];

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const advance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (next) {
      updateMutation.mutate({ id: task.id, payload: { status: next } });
    }
  };

  const goBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prev) {
      updateMutation.mutate({ id: task.id, payload: { status: prev } });
    }
  };

  return (
    <div
      onClick={() => onOpen(task)}
      className="group relative flex flex-col p-2.5 rounded-lg border border-gray-200 bg-white shadow-xs hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center justify-center size-5 rounded bg-gray-100 text-gray-600 font-bold text-[10px] shrink-0 border border-gray-200">
            {task.title.charAt(0).toUpperCase()}
          </div>
          <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate leading-tight">
            {task.title}
          </h4>
        </div>
        <TaskSourceBadge aiMeta={task.aiMeta} />

        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate(task.id);
            }}
            disabled={deleteMutation.isPending}
            className="shrink-0 p-0.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Delete task"
          >
            {deleteMutation.isPending ? (
              <Loader2 size={12} className="animate-spin text-red-600" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        )}
      </div>

      <div className="space-y-1 my-1 text-[11px] text-gray-500">
        {departmentName && (
          <div className="flex items-center justify-between">
            <span>Dept:</span>
            <span className={`font-medium px-1.5 py-0.2 rounded text-[10px] ${departmentTagClass(departmentName)}`}>
              {departmentName}
            </span>
          </div>
        )}

        {priority && (
          <div className="flex items-center justify-between">
            <span>Priority:</span>
            <span className={`font-semibold text-[10px] ${priority.className}`}>
              {priority.label}
            </span>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center justify-between">
            <span>Due:</span>
            <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
              <Clock size={10} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5 min-w-0">
          {assigneeName ? (
            <div
              className="flex items-center justify-center size-5 rounded-full bg-slate-700 text-white text-[9px] font-bold shrink-0"
              title={`Assigned to ${assigneeName}`}
            >
              {getInitials(assigneeName)}
            </div>
          ) : (
            <div className="flex items-center justify-center size-5 rounded-full border border-dashed border-gray-300 text-gray-400 shrink-0 bg-gray-50" title="Unassigned">
              <User size={10} />
            </div>
          )}
          <span className="text-[11px] text-gray-700 font-medium truncate">
            {assigneeName || "Unassigned"}
          </span>
        </div>

        {next ? (
          <div className="flex items-center">
            {/* Revealed on card hover with a slide-in, instead of always sitting next to the
                forward arrow — it's the less-common action, so it stays out of the way until
                the user is already interacting with this card. */}
            {prev && (
              <button
                type="button"
                onClick={goBack}
                disabled={updateMutation.isPending}
                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out"
                title={`Move back to ${STATUS_LABEL[prev]}`}
              >
                <ArrowLeft size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={advance}
              disabled={updateMutation.isPending}
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title={`Move to ${STATUS_LABEL[next]}`}
            >
              {updateMutation.isPending ? <Loader2 size={12} className="animate-spin text-blue-600" /> : <ArrowRight size={12} />}
            </button>
          </div>
        ) : task.status === 'pending_verification' ? (
          isVerifier ? (
            <TaskVerifyActions task={task} />
          ) : (
            <span title="Awaiting verification">
              <ShieldQuestion size={12} className="text-amber-500" />
            </span>
          )
        ) : (
          <span title="Task Completed">
            <CheckCircle2 size={12} className="text-emerald-500" />
          </span>
        )}
      </div>

      {updateMutation.isError && (
        <div className="flex items-center gap-1 mt-1.5 p-1 bg-red-50 rounded text-[10px] text-red-600 font-medium border border-red-100">
          <AlertCircle size={10} className="shrink-0 text-red-600" />
          <span className="truncate">{updateMutation.error instanceof Error ? updateMutation.error.message : 'Error updating.'}</span>
        </div>
      )}
    </div>
  );
};