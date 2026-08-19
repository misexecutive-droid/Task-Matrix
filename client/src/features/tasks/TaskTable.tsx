import { Clock, User, ListChecks, CalendarPlus, History } from 'lucide-react';
import { PRIORITY_MAP, STATUS_CONFIG } from './taskDisplay';
import { TaskScoreBadge } from './TaskScoreBadge';
import { departmentTagClass } from './departmentTagColors';
import { CATEGORY_CONFIG, subtaskProgress, formatShortDate, formatShortDateTime, type CardFieldVisibility } from './cardFields';
import type { Task } from '../../api/task';

interface TaskTableProps {
  tasks:            Task[];
  assigneeNames:    Map<string, string>;
  departmentNames:  Map<string, string>;
  onOpen:           (task: Task) => void;
  fields:           CardFieldVisibility;
}

export const TaskTable = ({ tasks, assigneeNames, departmentNames, onOpen, fields }: TaskTableProps) => {
  const columns = [
    { key: 'department', label: 'Department', show: fields.department },
    { key: 'assignee', label: 'Assignee', show: fields.assignee },
    { key: 'dueDate', label: 'Due', show: fields.dueDate },
    { key: 'status', label: 'Status', show: fields.status },
    { key: 'mark', label: 'Mark', show: fields.status },
    { key: 'priority', label: 'Priority', show: fields.priority },
    { key: 'category', label: 'Category', show: fields.category },
    { key: 'subtasks', label: 'Subtasks', show: fields.subtasks },
    { key: 'created', label: 'Created', show: fields.created },
    { key: 'updated', label: 'Updated', show: fields.updated },
  ].filter(c => c.show);

  return (
    <div className="rounded border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-700">
              <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                Title
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                >
                  {c.label}
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
              const subtasks = subtaskProgress(task);

              return (
                <tr
                  key={task.id}
                  onClick={() => onOpen(task)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpen(task);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="bg-surface hover:bg-surface-hover transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-inset"
                >
                  <td className="px-4 py-2.5 min-w-[14rem]">
                    <span className={`font-semibold ${task.status === 'done' ? 'line-through text-text-light' : 'text-text'}`}>
                      {task.title}
                    </span>
                  </td>

                  {columns.map((c) => {
                    switch (c.key) {
                      case 'department':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            {departmentName ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${departmentTagClass(departmentName)}`}>
                                {departmentName}
                              </span>
                            ) : (
                              <span className="text-text-light">—</span>
                            )}
                          </td>
                        );
                      case 'assignee':
                        return (
                          <td key={c.key} className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                            {assigneeName ? (
                              <span className="flex items-center gap-1.5">
                                <User size={13} strokeWidth={2.5} className="text-text-light" />
                                {assigneeName}
                              </span>
                            ) : (
                              <span className="text-text-light">Unassigned</span>
                            )}
                          </td>
                        );
                      case 'dueDate':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            {task.dueDate ? (
                              <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-danger font-semibold' : 'text-text-secondary'}`}>
                                <Clock size={13} strokeWidth={2.5} className={isOverdue ? 'text-danger' : 'text-text-light'} />
                                {formatShortDate(task.dueDate)}
                              </span>
                            ) : (
                              <span className="text-text-light">—</span>
                            )}
                          </td>
                        );
                      case 'status':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.badge}`}>
                              {status.label}
                            </span>
                          </td>
                        );
                      case 'mark':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <TaskScoreBadge status={task.status} />
                          </td>
                        );
                      case 'priority':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${priority.className}`}>
                              <span className={`size-1.5 rounded-full shrink-0 ${priority.accent}`} />
                              {priority.label}
                            </span>
                          </td>
                        );
                      case 'category': {
                        const cat = CATEGORY_CONFIG[task.category];
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.className}`}>
                              <cat.icon size={13} strokeWidth={2.5} />
                              {cat.label}
                            </span>
                          </td>
                        );
                      }
                      case 'subtasks':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            {subtasks ? (
                              <span className="flex items-center gap-1.5 text-text-secondary">
                                <ListChecks size={13} strokeWidth={2.5} className="text-text-light" />
                                {subtasks.done}/{subtasks.total}
                              </span>
                            ) : (
                              <span className="text-text-light">—</span>
                            )}
                          </td>
                        );
                      case 'created':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-text-secondary">
                              <CalendarPlus size={13} strokeWidth={2.5} className="text-text-light" />
                              {formatShortDateTime(task.createdAt)}
                            </span>
                          </td>
                        );
                      case 'updated':
                        return (
                          <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-text-secondary">
                              <History size={13} strokeWidth={2.5} className="text-text-light" />
                              {formatShortDateTime(task.updatedAt)}
                            </span>
                          </td>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
