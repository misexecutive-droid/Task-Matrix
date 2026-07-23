import { 
  ChevronRight, 
  Loader2, 
  Trash2, 
  Calendar, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  Sparkles 
} from "lucide-react";
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
  index?: number;
}

// Helper to create a sleek initial-based avatar
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const TaskBoardCard = ({ task, assigneeName, isAdmin, onOpen, index = 0 }: TaskBoardCardProps) => {
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
      className="group relative flex flex-col p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-primary-500/30 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms`, animationFillMode: 'both' }}
    >
      {/* Top Row: Priority Badge & Admin Actions */}
      <div className="flex items-start justify-between mb-2">
        {priority && (
          <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${priority.className}`}>
            <span className="size-1.5 rounded-full bg-current shrink-0" />
            {priority.label}
          </span>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate(task.id);
            }}
            disabled={deleteMutation.isPending}
            className="shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50"
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
      <h4 className="text-sm font-mono font-medium text-text group-hover:text-primary-600 transition-colors line-clamp-2 leading-relaxed mb-4">
        {task.title}
      </h4>

      {/* Meta Row: Due Date & Assignee */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col gap-1.5">
          {task.dueDate && (
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-danger' : 'text-text-muted'}`}>
              <Clock size={13} className={isOverdue ? 'text-danger' : 'text-text-muted'} />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              {isOverdue && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-danger/10 text-danger">Overdue</span>}
            </div>
          )}
        </div>

        {/* User Avatar instead of a text pill */}
        {assigneeName ? (
          <div
            className="flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-[10px] font-bold shrink-0 shadow-sm ring-2 ring-surface"
            title={`Assigned to ${assigneeName}`}
          >
            {getInitials(assigneeName)}
          </div>
        ) : (
          <div className="flex items-center justify-center size-6 rounded-full border border-dashed border-border text-text-muted shrink-0" title="Unassigned">
            <User size={12} />
          </div>
        )}
      </div>

      {updateMutation.isError && (
        <div className="mt-3 p-2 bg-danger/10 rounded-md text-[11px] text-danger font-medium border border-danger/20">
          {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update task.'}
        </div>
      )}

      {/* Bottom Action Footer - Separated by a subtle divider */}
      <div className="pt-3 mt-3 border-t border-border/50">
        {next ? (
          <button
            type="button"
            onClick={advance}
            disabled={updateMutation.isPending}
            className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-primary-600 transition-colors group/btn disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              {updateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
              Move to {STATUS_LABEL[next]}
            </span>
            <ArrowRight size={13} className="opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 size={13} />
            Task Completed
          </span>
        )}
      </div>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {COLUMNS.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);

        return (
          <div
            key={status}
            className="flex flex-col rounded-2xl bg-surface-hover/40 border border-border/60 min-w-0 overflow-hidden"
          >
            {/* Status Accent Bar */}
            <div className={`h-1 shrink-0 ${
              status === 'done' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              status === 'in_progress' ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
              'bg-gradient-to-r from-primary-500 to-primary-400'
            }`} />

            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg shadow-sm border ${
                  status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                  status === 'in_progress' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                  'bg-surface border-border text-primary-500'
                }`}>
                  {STATUS_ICON[status]}
                </div>
                <h3 className="text-sm font-mono font-semibold text-text">
                  {STATUS_LABEL[status]}
                </h3>
              </div>
              <span className="flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-medium text-text-secondary bg-surface rounded-full border border-border shadow-sm">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Body Stack */}
            <div className="flex flex-col gap-3 p-3 min-h-[200px]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 px-4 text-center border-2 border-dashed border-border/60 rounded-xl bg-surface/50 text-text-muted">
                  <Sparkles size={18} className="mb-2 opacity-40" />
                  <span className="text-sm font-medium">No tasks here</span>
                </div>
              ) : (
                columnTasks.map((task, i) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    onOpen={onOpen}
                    index={i}
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