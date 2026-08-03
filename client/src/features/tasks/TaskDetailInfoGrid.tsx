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
    <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
      <Icon size={14} className={iconClassName} /> {label}
    </span>
    <span className="text-gray-900 font-semibold text-sm">{children}</span>
  </div>
);

/** Responsive strip of created date, due date, assignee, and department —
 *  a single row on wide screens, wrapping to 2 columns on mobile. */
export const TaskDetailInfoGrid = ({ task, isOverdue }: { task: Task; isOverdue: boolean | null | undefined }) => {
  const assignee = (task as any).assignee;
  const department = (task as any).department;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y divide-x-0 sm:divide-y-0 sm:divide-x divide-gray-200 bg-gray-50/50 border border-gray-200 rounded-xl text-xs shadow-sm overflow-hidden">
      <Cell icon={Calendar} iconClassName="text-blue-500" label="Created">
        {new Date(task.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Cell>

      <Cell icon={Clock} iconClassName={isOverdue ? 'text-red-500' : 'text-gray-400'} label="Due Date">
        <span className={`flex items-center gap-1.5 ${
          isOverdue ? 'text-red-700' : task.dueDate ? 'text-gray-900' : 'text-gray-500 font-medium'
        }`}>
          {task.dueDate ? (
            <>
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {isOverdue && <AlertCircle size={14} className="text-red-600 shrink-0" />}
            </>
          ) : (
            'No deadline'
          )}
        </span>
      </Cell>

      {assignee ? (
        <Cell icon={User} iconClassName="text-indigo-500" label="Assignee">
          <span className="truncate block">{assignee.firstName} {assignee.lastName ?? ''}</span>
        </Cell>
      ) : (
        <Cell icon={User} iconClassName="text-gray-400" label="Assignee">
          <span className="text-gray-500 font-medium">Unassigned</span>
        </Cell>
      )}

      {department && (
        <Cell icon={Building2} iconClassName="text-blue-500" label="Department">
          <span className="truncate block">{department.name}</span>
        </Cell>
      )}
    </div>
  );
};