import { Clock, User } from 'lucide-react';
import { PRIORITY_MAP, STATUS_CONFIG } from './taskDisplay';
import type { Task } from '../../api/task';

interface TaskTableProps {
  tasks:            Task[];
  assigneeNames:    Map<string, string>;
  departmentNames:  Map<string, string>;
  onOpen:           (task: Task) => void;
}

const HEADERS = ['Title', 'Department', 'Assignee', 'Due', 'Status', 'Priority'];

export const TaskTable = ({ tasks, assigneeNames, departmentNames, onOpen }: TaskTableProps) => {
  return (
    <div className="rounded border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-700">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const priority = PRIORITY_MAP[task.priority];
              const status = STATUS_CONFIG[task.status];
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
              const assigneeName = task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined;
              const departmentName = task.departmentId ? departmentNames.get(task.departmentId) : undefined;

              return (
                <tr
                  key={task.id}
                  onClick={() => onOpen(task)}
                  className="bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2.5 min-w-[14rem]">
                    <span className={`font-semibold ${task.status === 'done' ? 'line-through text-text-light' : 'text-text'}`}>
                      {task.title}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                    {departmentName ?? <span className="text-text-light">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                    {assigneeName ? (
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-text-light" />
                        {assigneeName}
                      </span>
                    ) : (
                      <span className="text-text-light">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {task.dueDate ? (
                      <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-danger font-semibold' : 'text-text-secondary'}`}>
                        <Clock size={12} className={isOverdue ? 'text-danger' : 'text-text-light'} />
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-text-light">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${status.badge}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${priority.className}`}>
                      <span className={`size-1.5 rounded-full shrink-0 ${priority.accent}`} />
                      {priority.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
