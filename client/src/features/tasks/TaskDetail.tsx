import { useTaskQuery, useUpdateTaskMutation } from './hook';
import { TaskVerifyActions } from './TaskVerifyActions';
import { TaskDetailHeader } from './TaskDetailHeader';
import { TaskDetailInfoGrid } from './TaskDetailInfoGrid';
import { TaskDescriptionSection } from './TaskDescriptionSection';
import { TaskVerificationBanner } from './TaskVerificationBanner';
import { TaskAttachmentsSection } from './TaskAttachmentsSection';
import { TaskDetailFooter } from './TaskDetailFooter';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '../../context/AuthContext';
import { NEXT_STATUS } from './taskDisplay';
import type { Task } from '../../api/task';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

// Checklists/subtasks panel is temporarily hidden here (not removed — TaskChecklistPanel
// and friends are untouched) while that feature is being reworked. Re-add the panel back
// into the scrollable body below once it's ready.

/** Bottom sheet showing a task's full details: header, info grid, description,
 *  attachments, verification banner, PC verify actions, and status/close footer. */
export const TaskDetail = ({ task: initialTask, onClose }: TaskDetailProps) => {
  const { data: fresh } = useTaskQuery(initialTask.id);
  const task = fresh ?? initialTask;
  const { user } = useAuth();
  const isVerifier = user?.role === 'PC' || user?.role === 'ADMIN';
  const canManageAttachments = Boolean(
    user && (user.role === 'ADMIN' || task.userId === user.id || task.assigneeId === user.id)
  );

  const updateMutation = useUpdateTaskMutation();
  const nextStatus = NEXT_STATUS[task.status];

  const isOverdue = Boolean(
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done'
  );

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="flex flex-col h-[92vh] sm:h-[88vh] w-full p-0 overflow-hidden rounded-t-2xl sm:rounded-t-3xl border-t border-gray-200 bg-white shadow-2xl text-gray-900 transition-all outline-none"
      >
        <div className={`h-1.5 shrink-0 transition-all duration-300 ${task.status === 'done'
            ? 'bg-emerald-500' :
            task.status === 'in_progress'
              ? 'bg-amber-500' :
              task.status === 'pending_verification'
                ? 'bg-indigo-500' :
                'bg-gray-400'
          }`} />

        <TaskDetailHeader task={task} isOverdue={isOverdue} />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            <TaskDetailInfoGrid task={task} isOverdue={isOverdue} />

            <TaskDescriptionSection description={task.description} />

            <TaskAttachmentsSection
              taskId={task.id}
              attachments={task.attachments ?? []}
              canManage={canManageAttachments}
            />

            <TaskVerificationBanner task={task} />
          </div>
        </div>

        {/* PC/Admin verification actions — only shown while the task is awaiting review */}
        {isVerifier && task.status === 'pending_verification' && (
          <div className="border-t border-gray-200 bg-gray-50/80">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-3 pb-2">
              <TaskVerifyActions task={task} />
            </div>
          </div>
        )}

        <TaskDetailFooter
          task={task}
          isVerifier={isVerifier}
          nextStatus={nextStatus}
          isAdvancing={updateMutation.isPending}
          onAdvance={() => nextStatus && updateMutation.mutate({ id: task.id, payload: { status: nextStatus } })}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  );
};