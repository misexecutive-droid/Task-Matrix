import { Sparkles } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { STATUS_LABEL, STATUS_CONFIG } from "./taskDisplay";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-start">
      {COLUMNS.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);

        return (
          <div key={status} className="flex flex-col rounded-lg border border-gray-200 bg-gray-50/40 min-w-0 p-1.5">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`size-2 rounded-full shrink-0 ${STATUS_CONFIG[status].indicator}`} />
                <h3 className="text-xs font-semibold text-gray-700 truncate">
                  {STATUS_LABEL[status]}
                </h3>
                <span className="px-1.5 py-0.2 text-[11px] font-semibold text-gray-500 bg-gray-200/60 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-h-[150px]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 px-3 text-center border border-dashed border-gray-200 rounded-md bg-white/40 text-gray-400">
                  <Sparkles size={14} className="mb-1 text-gray-300" />
                  <span className="text-[11px] font-medium text-gray-400">No tasks</span>
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