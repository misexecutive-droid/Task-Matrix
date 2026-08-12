import type { ReactNode } from 'react';
import { Calendar, Clock, AlertCircle, User, Building2 } from 'lucide-react';
import type { Task } from '../../api/task';

const Cell = ({
  icon: Icon, iconClassName, label, children,
}: {
  icon: typeof Calendar;
  iconClassName: string;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 p-4 sm:p-5">
    <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
      <Icon size={14} className={iconClassName} /> {label}
    </span>
    <span className="text-text font-semibold text-sm">{children}</span>
  </div>
);

interface TaskDetailInfoGridProps {
  task: Task;
  isOverdue: boolean | null | undefined;
  assigneeName?: string;
  departmentName?: string;
}

/** Responsive strip of created date, due date, assignee, and department —
 *  a single row on wide screens, wrapping to 2 columns on mobile. */
export const TaskDetailInfoGrid = ({ task, isOverdue, assigneeName, departmentName }: TaskDetailInfoGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y divide-x-0 sm:divide-y-0 sm:divide-x divide-border bg-surface-hover/50 border border-border rounded text-xs shadow-sm overflow-hidden">
      <Cell icon={Calendar} iconClassName="text-blue-500" label="Created">
        {new Date(task.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Cell>

      <Cell icon={Clock} iconClassName={isOverdue ? 'text-danger' : 'text-text-light'} label="Due Date">
        <span className={`flex items-center gap-1.5 ${
          isOverdue ? 'text-danger' : task.dueDate ? 'text-text' : 'text-text-muted font-medium'
        }`}>
          {task.dueDate ? (
            <>
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {isOverdue && <AlertCircle size={14} className="text-danger shrink-0" />}
            </>
          ) : (
            'No deadline'
          )}
        </span>
      </Cell>

      <Cell icon={User} iconClassName={assigneeName ? 'text-indigo-500' : 'text-text-light'} label="Assignee">
        {assigneeName ? (
          <span className="truncate block">{assigneeName}</span>
        ) : (
          <span className="text-text-muted font-medium">Unassigned</span>
        )}
      </Cell>

      <Cell icon={Building2} iconClassName="text-blue-500" label="Department">
        {departmentName ? (
          <span className="truncate block">{departmentName}</span>
        ) : (
          <span className="text-text-muted font-medium">No department</span>
        )}
      </Cell>
    </div>
  );
};