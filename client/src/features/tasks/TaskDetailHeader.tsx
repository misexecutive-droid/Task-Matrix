import { AlertCircle, Tag } from 'lucide-react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PRIORITY_MAP, STATUS_LABEL } from './taskDisplay';
import type { Task } from '../../api/task';

/** Sheet header: priority/status/overdue badges + the task title. */
export const TaskDetailHeader = ({ task, isOverdue }: { task: Task; isOverdue: boolean | null | undefined }) => {
  const priority = PRIORITY_MAP[task.priority];

  return (
    <SheetHeader className="flex-col items-stretch justify-start gap-0 p-0 border-b border-gray-200 bg-gray-50/50">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col items-start gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {priority && (
            <span
              className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border shadow-sm ${priority.className}`}
            >
              <span className="size-1.5 rounded-full bg-current shrink-0" />
              {priority.label}
            </span>
          )}

          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center gap-1 shadow-sm">
            <Tag size={10} className="text-gray-400" />
            {STATUS_LABEL[task.status]}
          </span>

          {isOverdue && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-1 animate-pulse shadow-sm">
              <AlertCircle size={10} className="text-red-600" /> Overdue
            </span>
          )}
        </div>

        <SheetTitle className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-snug">
          {task.title}
        </SheetTitle>
      </div>
    </SheetHeader>
  );
};