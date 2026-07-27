import { Sparkles } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { STATUS_ICON, STATUS_LABEL } from "./taskDisplay";
import type { Task } from "../../api/task";

const COLUMNS: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];

interface TaskBoardProps {
  tasks: Task[];
  assigneeNames: Map<string, string>;
  isAdmin: boolean;
  isVerifier?: boolean;
  onOpen: (task: Task) => void;
}

export const TaskBoard = ({ tasks, assigneeNames, isAdmin, isVerifier = false, onOpen }: TaskBoardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
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
              status === 'pending_verification' ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' :
              'bg-gradient-to-r from-primary-500 to-primary-400'
            }`} />

            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg shadow-sm border ${
                  status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                  status === 'in_progress' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                  status === 'pending_verification' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' :
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
                  <TaskCard
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    isVerifier={isVerifier}
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