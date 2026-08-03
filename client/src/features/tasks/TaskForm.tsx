import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckSquare, FileText, Heading, Calendar } from 'lucide-react';
import { Input, Textarea, Modal, DateField } from '../../components';
import { useCreateTaskMutation, useAssignableUsersQuery } from './hook';
import { useDepartmentsQuery } from '../tickets/hook';
import { taskApi } from '../../api/task';
import { TaskFormPrioritySelector } from './TaskFormPrioritySelector';
import { TaskFormDepartmentField } from './TaskFormDepartmentField';
import { TaskFormAssigneeField } from './TaskFormAssigneeField';
import { TaskAttachmentPicker } from './TaskAttachmentPicker';
import { TaskFormFooter } from './TaskFormFooter';
import { TaskFormErrorBanner } from './TaskFormErrorBanner';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';

const taskSchema = z.object({
  title:        z.string().trim().min(1, 'Title is required'),
  description:  z.string().optional(),
  priority:     z.enum(['low', 'medium', 'high']),
  dueDate:      z.string().optional().or(z.literal('')),
  assigneeId:   z.string().optional().or(z.literal('')),
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      assigneeId: '',
      departmentId: '',
    },
  });

  const priority     = watch('priority');
  const assigneeId   = watch('assigneeId');
  const departmentId = watch('departmentId');

  const onSubmit = (data: TaskFields) => {
    mutation.mutate(
      {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        dueDate:      data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assigneeId:   data.assigneeId !== '' ? data.assigneeId : undefined,
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
      size="xl"
      contentClassName="accent-blue"
      icon={<CheckSquare className="w-5 h-5 text-blue-600" />}
      title={
        <div className="flex items-center gap-2 truncate">
          <span className="text-xl font-bold text-text">Create New Task</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            Draft
          </span>
        </div>
      }
      description="Define objectives, set priorities, and assign responsible members."
      footer={<TaskFormFooter onClose={onClose} isPending={mutation.isPending} isSubmitting={isSubmitting} />}
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div>
          <Input
            id="title"
            label={<>Task Title <span className="text-danger">*</span></>}
            icon={Heading}
            iconClassName={FIELD_LABEL_ICON_CLASS}
            placeholder="e.g. Redesign the landing page hero section"
            error={errors.title?.message}
            className="focus:border-blue-500 focus:ring-blue-500/20"
            labelClassName={FIELD_LABEL_CLASS}
            {...register('title')}
            autoFocus
          />
        </div>

        <div>
          <Textarea
            id="description"
            label="Description"
            icon={FileText}
            iconClassName={FIELD_LABEL_ICON_CLASS}
            rows={3}
            placeholder="Provide task context, constraints, acceptance criteria, or relevant links…"
            className="focus:border-blue-500 focus:ring-blue-500/20"
            labelClassName={FIELD_LABEL_CLASS}
            {...register('description')}
          />
        </div>

        <TaskFormPrioritySelector value={priority} onChange={(v) => setValue('priority', v)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col justify-end">
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DateField
                  id="dueDate"
                  label="Due Date"
                  icon={Calendar}
                  iconClassName={FIELD_LABEL_ICON_CLASS}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.dueDate?.message}
                  labelClassName={FIELD_LABEL_CLASS}
                />
              )}
            />
          </div>

          <TaskFormDepartmentField
            value={departmentId ?? ''}
            onChange={(v) => setValue('departmentId', v)}
            departments={departments}
            isLoading={isLoadingDepts}
          />
        </div>

        <TaskFormAssigneeField
          value={assigneeId ?? ''}
          onChange={(v) => setValue('assigneeId', v)}
          users={assignableUsers}
          isLoading={isLoadingUsers}
        />

        <TaskAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />

        {mutation.isError && (
          <TaskFormErrorBanner error={mutation.error} fallback="Failed to create task. Please verify your inputs and try again." />
        )}
      </form>
    </Modal>
  );
};
