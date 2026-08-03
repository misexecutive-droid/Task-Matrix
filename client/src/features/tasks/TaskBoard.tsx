import { Sparkles } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { STATUS_ICON, STATUS_LABEL } from "./taskDisplay";
import type { Task } from "../../api/task";

const COLUMNS: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];

// Upgraded to absolute Tailwind colors for a reliable, professional UI
const COLUMN_THEME: Record<Task['status'], { borderTop: string; iconBg: string; emptyIcon: string }> = {
  todo: {
    borderTop: 'border-t-gray-400',
    iconBg:    'bg-white text-gray-500 border-gray-200 shadow-sm',
    emptyIcon: 'text-gray-300',
  },
  in_progress: {
    borderTop: 'border-t-amber-500',
    iconBg:    'bg-amber-50 text-amber-600 border-amber-200',
    emptyIcon: 'text-amber-300',
  },
  pending_verification: {
    borderTop: 'border-t-indigo-500',
    iconBg:    'bg-indigo-50 text-indigo-600 border-indigo-200',
    emptyIcon: 'text-indigo-300',
  },
  done: {
    borderTop: 'border-t-emerald-500',
    iconBg:    'bg-emerald-50 text-emerald-600 border-emerald-200',
    emptyIcon: 'text-emerald-300',
  },
};

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
        const theme = COLUMN_THEME[status];

        return (
          <div
            key={status}
            // Strictly using "rounded" for sharper, professional corners
            className={`flex flex-col rounded border border-gray-200 bg-gray-50/50 min-w-0 shadow-sm overflow-hidden transition-all border-t-4 ${theme.borderTop}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex items-center justify-center p-1.5 rounded border shrink-0 ${theme.iconBg}`}>
                  {STATUS_ICON[status]}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight truncate">
                  {STATUS_LABEL[status]}
                </h3>
              </div>

              {/* Task Count Badge */}
              <span className="flex items-center justify-center min-w-[1.75rem] h-6 px-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-full border border-gray-200 shrink-0">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Body Stack */}
            <div className="flex flex-col gap-3 p-3 sm:p-4 min-h-[250px]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 px-4 text-center border-2 border-dashed border-gray-200 rounded bg-white/50 text-gray-400">
                  <Sparkles size={20} className={`mb-2 ${theme.emptyIcon}`} />
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