import { useState } from 'react';
import { CheckSquare, Heading, FileText, CalendarRange, Loader2, ChevronRight, CheckCircle2, ShieldQuestion, Trash2 } from 'lucide-react';
import { Modal, Textarea, Button, DateRangePicker } from '../../components';
import type { DateRangeValue } from '../../components';
import { useTaskQuery, useUpdateTaskMutation, useDeleteTaskMutation, useAssignableUsersQuery } from './hook';
import { useDepartmentsQuery } from '../tickets/hook';
import { TaskVerifyActions } from './TaskVerifyActions';
import { TaskFormPrioritySelector } from './TaskFormPrioritySelector';
import { TaskFormDepartmentField } from './TaskFormDepartmentField';
import { TaskAssigneesField } from './TaskAssigneesField';
import { TaskFormReminderField } from './TaskFormReminderField';
import { TaskActivitySection } from './TaskActivitySection';
import { TaskAttachmentsSection } from './TaskAttachmentsSection';
import { TaskVerificationBanner } from './TaskVerificationBanner';
import { STATUS_LABEL, NEXT_STATUS } from './taskDisplay';
import { TaskScoreBadge } from './TaskScoreBadge';
import { taskAssigneeIds } from './cardFields';
import { useAuth } from '../../context/AuthContext';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';
import type { Task } from '../../api/task';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail = ({ task: initialTask, onClose }: TaskDetailProps) => {
  const { data: fresh } = useTaskQuery(initialTask.id);
  const task = fresh ?? initialTask;
  const { user } = useAuth();
  const isPC = user?.role === 'PC';
  const isVerifier = isPC || user?.role === 'ADMIN';
  // Mirrors the server's assertCanAttach in taskAttachment.service.ts — creator, assignee, or
  // Admin/PC. Looser than checklist-item evidence (assignee-only) since this is general
  // reference material on the task itself, not one person's specific work item.
  const canManageAttachments = isVerifier
    || task.userId === user?.id
    || taskAssigneeIds(task).includes(user?.id ?? '');

  const updateMutation = useUpdateTaskMutation({ silent: true });
  const deleteMutation = useDeleteTaskMutation();
  const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
  const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery();

  // TaskList mounts this with `key={task.id}`, so switching tasks remounts fresh instead of
  // needing an effect to resync these from a new task prop.
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');

  const nextStatus = NEXT_STATUS[task.status];

  const saveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      updateMutation.mutate({ id: task.id, payload: { title: trimmed } });
    } else {
      setTitle(task.title);
    }
  };

  const saveDescription = () => {
    if (description !== (task.description ?? '')) {
      updateMutation.mutate({ id: task.id, payload: { description } });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="2xl"
      icon={<CheckSquare className="w-5 h-5 text-primary-600" />}
      title="Edit delegation"
      description="Changes save automatically as you edit each field."
      bodyClassName="p-0"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2.5">
            <TaskScoreBadge status={task.status} />
            {task.status === 'done' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <CheckCircle2 size={15} /> Completed
              </span>
            )}
            {task.status === 'pending_verification' && !isVerifier && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-info">
                <ShieldQuestion size={15} /> Awaiting verification
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {nextStatus && !isPC && (
              <Button
                variant="outline"
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: task.id, payload: { status: nextStatus } })}
              >
                {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                Advance to {STATUS_LABEL[nextStatus]}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Left column — content */}
        <div className="flex flex-col gap-5 p-5 border-b lg:border-b-0 lg:border-r border-border/60">
          <div className="group/field flex flex-col gap-1.5">
            <label className={FIELD_LABEL_CLASS}>
              <Heading className={FIELD_LABEL_ICON_CLASS} /> Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              placeholder="Delegation title"
              disabled={isPC}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-semibold text-text outline-none transition-colors hover:border-border-hover focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:bg-surface-hover disabled:text-text-light disabled:cursor-not-allowed"
            />
          </div>

          <Textarea
            id="task-description"
            label="Description"
            icon={FileText}
            iconClassName={FIELD_LABEL_ICON_CLASS}
            labelClassName={FIELD_LABEL_CLASS}
            containerClassName="flex-1 min-h-0"
            className="h-full min-h-[100px] resize-none"
            rows={6}
            placeholder="Add more detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            disabled={isPC}
          />

          <TaskVerificationBanner task={task} />

          {isVerifier && task.status === 'pending_verification' && (
            <TaskVerifyActions task={task} />
          )}

          <TaskAttachmentsSection
            taskId={task.id}
            attachments={task.attachments ?? []}
            canManage={canManageAttachments}
          />
        </div>

        {/* Right column — fields */}
        <div className="flex flex-col gap-5 p-5">
          <TaskAssigneesField
            selectedIds={taskAssigneeIds(task)}
            onChange={(ids) =>
              updateMutation.mutate({
                id: task.id,
                payload: { assigneeId: ids[0] ?? null, additionalAssigneeIds: ids.slice(1) },
              })
            }
            users={assignableUsers}
            isLoading={isLoadingUsers}
            disabled={isPC}
          />

          <TaskFormPrioritySelector
            value={task.priority}
            onChange={(v) => updateMutation.mutate({ id: task.id, payload: { priority: v } })}
            disabled={isPC}
          />

          <div className="group/field flex flex-col gap-1.5">
            <label className={FIELD_LABEL_CLASS}>
              <CalendarRange className={FIELD_LABEL_ICON_CLASS} /> Start &amp; Due Date
            </label>
            <DateRangePicker
              value={{
                from: task.startDate ? new Date(task.startDate) : null,
                to: task.dueDate ? new Date(task.dueDate) : null,
              }}
              disabled={isPC}
              onChange={(range: DateRangeValue) =>
                updateMutation.mutate({
                  id: task.id,
                  payload: {
                    startDate: range.from ? range.from.toISOString() : undefined,
                    dueDate: range.to ? range.to.toISOString() : undefined,
                  },
                })
              }
            />
          </div>

          <TaskFormDepartmentField
            value={task.departmentId ?? ''}
            onChange={(v) => updateMutation.mutate({ id: task.id, payload: { departmentId: v || null } })}
            departments={departments}
            isLoading={isLoadingDepts}
            disabled={isPC}
          />

          <TaskFormReminderField
            minutes={task.reminderMinutesBefore}
            channel={task.reminderChannel}
            onChange={(minutes, reminderChannel) =>
              updateMutation.mutate({ id: task.id, payload: { reminderMinutesBefore: minutes, reminderChannel } })
            }
            disabled={isPC}
          />

          {isVerifier && (
            <Button
              variant="danger"
              size="sm"
              className="mt-auto gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(task.id, { onSuccess: onClose })}
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete task
            </Button>
          )}
        </div>
      </div>

      <TaskActivitySection taskId={task.id} />
    </Modal>
  );
};
