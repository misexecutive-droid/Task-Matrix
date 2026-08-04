import { Sparkles } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { STATUS_LABEL } from "./taskDisplay";
import type { Task } from "../../api/task";

const COLUMNS: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];

interface TaskBoardProps {
  tasks: Task[];
  assigneeNames: Map<string, string>;
  departmentNames?: Map<string, string>;
  isAdmin: boolean;
  isVerifier?: boolean;
  onOpen: (task: Task) => void;
}

export const TaskBoard = ({ tasks, assigneeNames, departmentNames, isAdmin, isVerifier = false, onOpen }: TaskBoardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
      {COLUMNS.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);

        return (
          <div
            key={status}
            className="flex flex-col rounded border border-gray-200 bg-gray-50/50 min-w-0 shadow-sm overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight truncate">
                {STATUS_LABEL[status]}
              </h3>

              {/* Task Count Badge */}
              <span className="flex items-center justify-center min-w-[1.75rem] h-6 px-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-full border border-gray-200 shrink-0">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Body Stack */}
            <div className="flex flex-col gap-3 p-3 sm:p-4 min-h-[250px]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 px-4 text-center border-2 border-dashed border-gray-200 rounded bg-white/50 text-gray-400">
                  <Sparkles size={18} className="mb-2 text-gray-300" />
                  <span className="text-sm font-medium text-gray-500">No tasks here</span>
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
                    departmentName={task.departmentId ? departmentNames?.get(task.departmentId) : undefined}
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