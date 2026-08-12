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
  assigneeName?: string;
  departmentName?: string;
  onClose: () => void;
}

export const TaskDetail = ({ task: initialTask, assigneeName, departmentName, onClose }: TaskDetailProps) => {
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
        className="flex flex-col h-[92vh] sm:h-[88vh] w-full p-0 overflow-hidden rounded-t border-t border-border bg-surface shadow-2xl text-text transition-all outline-none"
      >
        <div className={`h-1.5 shrink-0 transition-all duration-300 ${task.status === 'done'
            ? 'bg-success' :
            task.status === 'in_progress'
              ? 'bg-warning' :
              task.status === 'pending_verification'
                ? 'bg-info' :
                'bg-border-hover'
          }`} />

        <TaskDetailHeader task={task} isOverdue={isOverdue} />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-border-hover">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            <TaskDetailInfoGrid
              task={task}
              isOverdue={isOverdue}
              assigneeName={assigneeName}
              departmentName={departmentName}
            />

            <TaskDescriptionSection description={task.description} />

            <TaskAttachmentsSection
              taskId={task.id}
              attachments={task.attachments ?? []}
              canManage={canManageAttachments}
            />

            <TaskVerificationBanner task={task} />
          </div>
        </div>

        {isVerifier && task.status === 'pending_verification' && (
          <div className="border-t border-border bg-surface-hover/80">
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