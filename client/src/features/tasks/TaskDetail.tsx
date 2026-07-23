import { Clock, ChevronRight, Loader2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTaskQuery, useUpdateTaskMutation } from './hook';
import { TaskChecklistPanel } from './TaskChecklistPanel';
import { Button, Skeleton } from '../../components';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { useAuth } from '../../context/AuthContext';
import { PRIORITY_MAP, STATUS_LABEL, NEXT_STATUS } from './TaskList';
import type { Task } from '../../api/task';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail = ({ task: initialTask, onClose }: TaskDetailProps) => {
  const { data: fresh, isPending } = useTaskQuery(initialTask.id);
  const task = fresh ?? initialTask;
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const updateMutation = useUpdateTaskMutation();
  const priority = PRIORITY_MAP[task.priority];
  const next = NEXT_STATUS[task.status];

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done';

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="flex flex-col h-full sm:max-w-md p-0">
        
        {/* Header Section */}
        <SheetHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {priority && (
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${priority.className}`}
              >
                {priority.label}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-surface-hover border border-border text-text-secondary">
              {STATUS_LABEL[task.status]}
            </span>
          </div>

          <SheetTitle className="text-xl font-display font-bold text-text leading-snug">
            {task.title}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-20 w-full rounded-xl mt-4" />
            </div>
          ) : (
            <>
              {/* Metadata Panel */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-hover/30 border border-border/60 rounded-xl text-xs font-display">
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted text-[11px] font-medium flex items-center gap-1">
                    <Calendar size={12} /> Created
                  </span>
                  <span className="text-text font-medium">
                    {new Date(task.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-[11px] font-medium flex items-center gap-1">
                      <Clock size={12} /> Due Date
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isOverdue ? 'text-danger' : 'text-text'
                      }`}
                    >
                      {new Date(task.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {isOverdue && <AlertCircle size={12} className="text-danger" />}
                    </span>
                  </div>
                )}
              </div>

              {/* Description Section */}
              {task.description && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Description
                  </h3>
                  <div className="p-3.5 bg-surface rounded-xl border border-border/60 text-sm font-display text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>
              )}

              {/* Checklists */}
              <div className="pt-2">
                <TaskChecklistPanel
                  taskId={task.id}
                  checklists={task.checklists ?? []}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-border/50 bg-surface/50 backdrop-blur-xs flex-row justify-end gap-2.5">
          {next ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({ id: task.id, payload: { status: next } })
              }
            >
              {updateMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ChevronRight size={13} />
              )}
              Move to {STATUS_LABEL[next]}
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 mr-auto px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 size={14} />
              Completed
            </div>
          )}

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};