import { X, Clock } from 'lucide-react';
import { useTaskQuery } from './hook';
import { TaskChecklistPanel } from './TaskChecklistPanel';
import { Button, Skeleton } from '../../components';
import { useAuth } from '../../context/AuthContext';
import type { Task } from '../../api/task';

interface TaskDetailProps {
  task:    Task;
  onClose: () => void;
}

export const TaskDetail = ({ task: initialTask, onClose }: TaskDetailProps) => {
  const { data: fresh, isPending } = useTaskQuery(initialTask.id);
  const task = fresh ?? initialTask;
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg flex flex-col shadow-2xl bg-surface"
      >
        <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-display font-semibold text-text leading-snug">
              {task.title}
            </h2>
            <p className="text-xs text-text-muted font-display mt-0.5">
              Created {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-light hover:text-text transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-6">

          {isPending && (
            <div className="flex items-center justify-center py-8 text-text-muted">
              {/* <Loader2 size={18} className="animate-spin mr-2" />
              <span className="text-sm font-display">Loading…</span> */}

              <Skeleton className="h-1 w-full rounded-full"/>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-display text-text-muted">
                <Clock size={11} />
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {task.description && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-display font-semibold text-text-muted uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm font-display text-text-secondary leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <TaskChecklistPanel
            taskId={task.id}
            checklists={task.checklists ?? []}
            isAdmin={isAdmin}
            currentUserId={user?.id}
          />

        </div>

        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
};
