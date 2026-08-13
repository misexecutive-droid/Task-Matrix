import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckSquare, FileText, Heading, Calendar } from 'lucide-react';
import { Input, Textarea, Modal } from '../../components';
import { useCreateTaskMutation, useAssignableUsersQuery } from './hook';
import { useDepartmentsQuery } from '../tickets/hook';
import { taskApi } from '../../api/task';
import { TaskFormPrioritySelector } from './TaskFormPrioritySelector';
import { TaskFormDepartmentField } from './TaskFormDepartmentField';
import { TaskAssigneesField } from './TaskAssigneesField';
import { TaskFormReminderField } from './TaskFormReminderField';
import { TaskAttachmentPicker } from './TaskAttachmentPicker';
import { TaskFormFooter } from './TaskFormFooter';
import { TaskFormErrorBanner } from './TaskFormErrorBanner';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';

const taskSchema = z.object({
  title:        z.string().trim().min(1, 'Title is required'),
  description:  z.string().optional(),
  priority:     z.enum(['low', 'medium', 'high']),
  startDate:    z.string().optional().or(z.literal('')),
  dueDate:      z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
});

type TaskFields = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
}

export const TaskForm = ({ onClose }: TaskFormProps) => {
  const mutation = useCreateTaskMutation();
  const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
  const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery();
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      departmentId: '',
    },
  });

  const priority     = watch('priority');
  const departmentId = watch('departmentId');

  const onSubmit = (data: TaskFields) => {
    mutation.mutate(
      {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        startDate:    data.startDate ? new Date(data.startDate).toISOString() : undefined,
        dueDate:      data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        reminderMinutesBefore: reminderMinutes ?? undefined,
        assigneeId:   assigneeIds[0],
        additionalAssigneeIds: assigneeIds.slice(1),
        departmentId: data.departmentId !== '' ? data.departmentId : undefined,
      },
      {
        onSuccess: (createdTask) => {
          // No task id exists until creation succeeds, so staged files couldn't be uploaded
          // through the normal task-detail flow until now — fire them off in the background
          // rather than block closing the modal on it.
          if (attachmentFiles.length) {
            taskApi.uploadAttachments(createdTask.id, attachmentFiles).catch(() => {
              toast.error('Task created, but attaching files failed — you can add them from the task detail view.');
            });
          }
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="2xl"
      icon={<CheckSquare className="w-5 h-5 text-primary-600" />}
      title="Add new task"
      description="Define objectives, set priorities, and assign responsible members."
      bodyClassName="p-0"
      footer={<TaskFormFooter onClose={onClose} isPending={mutation.isPending} isSubmitting={isSubmitting} />}
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[1fr_20rem]" noValidate>
        {/* Left column — content */}
        <div className="flex flex-col gap-5 p-5 border-b lg:border-b-0 lg:border-r border-border/60">
          <Input
            id="title"
            label={<>Task Title <span className="text-danger">*</span></>}
            icon={Heading}
            iconClassName={FIELD_LABEL_ICON_CLASS}
            placeholder="e.g. Redesign the landing page hero section"
            error={errors.title?.message}
            className="focus:border-primary-500 focus:ring-primary-500/20"
            labelClassName={FIELD_LABEL_CLASS}
            {...register('title')}
            autoFocus
          />

          <Textarea
            id="description"
            label="Description"
            icon={FileText}
            iconClassName={FIELD_LABEL_ICON_CLASS}
            rows={6}
            placeholder="Provide task context, constraints, acceptance criteria, or relevant links…"
            className="focus:border-primary-500 focus:ring-primary-500/20"
            labelClassName={FIELD_LABEL_CLASS}
            {...register('description')}
          />

          <TaskAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />

          {mutation.isError && (
            <TaskFormErrorBanner error={mutation.error} fallback="Failed to create task. Please verify your inputs and try again." />
          )}
        </div>

        {/* Right column — fields */}
        <div className="flex flex-col gap-5 p-5">
          <TaskAssigneesField
            selectedIds={assigneeIds}
            onChange={setAssigneeIds}
            users={assignableUsers}
            isLoading={isLoadingUsers}
          />

          <TaskFormPrioritySelector value={priority} onChange={(v) => setValue('priority', v)} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="startDate"
              type="date"
              label="Start Date"
              icon={Calendar}
              iconClassName={FIELD_LABEL_ICON_CLASS}
              error={errors.startDate?.message}
              className="focus:border-primary-500 focus:ring-primary-500/20"
              labelClassName={FIELD_LABEL_CLASS}
              {...register('startDate')}
            />

            <Input
              id="dueDate"
              type="date"
              label="Due Date"
              icon={Calendar}
              iconClassName={FIELD_LABEL_ICON_CLASS}
              error={errors.dueDate?.message}
              className="focus:border-primary-500 focus:ring-primary-500/20"
              labelClassName={FIELD_LABEL_CLASS}
              {...register('dueDate')}
            />
          </div>

          <TaskFormDepartmentField
            value={departmentId ?? ''}
            onChange={(v) => setValue('departmentId', v)}
            departments={departments}
            isLoading={isLoadingDepts}
          />

          <TaskFormReminderField minutes={reminderMinutes} onChange={setReminderMinutes} />
        </div>
      </form>
    </Modal>
  );
};
