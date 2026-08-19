import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckSquare, FileText, Heading, CalendarRange } from 'lucide-react';
import { Input, Textarea, Modal, DateRangePicker } from '../../components';
import type { DateRangeValue } from '../../components';
import { useCreateTaskMutation, useAssignableUsersQuery } from './hook';
import { useDepartmentsQuery } from '../tickets/hook';
import { useAuth } from '../../context/AuthContext';
import type { Task } from '../../api/task';
import { TaskFormPrioritySelector } from './TaskFormPrioritySelector';
import { TaskFormDepartmentField } from './TaskFormDepartmentField';
import { TaskAssigneesField } from './TaskAssigneesField';
import { TaskFormReminderField } from './TaskFormReminderField';
import { TaskFormFooter } from './TaskFormFooter';
import { TaskFormErrorBanner } from './TaskFormErrorBanner';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';

const taskSchema = z.object({
  title:        z.string().trim().min(1, 'Title is required'),
  description:  z.string().optional(),
  priority:     z.enum(['low', 'medium', 'high']),
  departmentId: z.string().optional().or(z.literal('')),
});

type TaskFields = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
  /** Called with the newly-created task right after a successful create, so the caller can
   *  e.g. open its Edit task view immediately (that's where attachments/comments happen now). */
  onCreated?: (task: Task) => void;
}

export const TaskForm = ({ onClose, onCreated }: TaskFormProps) => {
  const { user } = useAuth();
  const mutation = useCreateTaskMutation();
  const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
  const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery();
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [reminderChannel, setReminderChannel] = useState<Task['reminderChannel']>('notification');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    // Defaults to the creator's own department — almost every delegation stays within a
    // department, so starting blank just meant re-picking the same value every time.
    defaultValues: {
      priority: 'medium',
      departmentId: user?.departmentId ?? '',
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
        startDate:    dateRange.from ? dateRange.from.toISOString() : undefined,
        dueDate:      dateRange.to ? dateRange.to.toISOString() : undefined,
        reminderMinutesBefore: reminderMinutes ?? undefined,
        reminderChannel: reminderMinutes ? reminderChannel : undefined,
        assigneeId:   assigneeIds[0],
        additionalAssigneeIds: assigneeIds.slice(1),
        departmentId: data.departmentId !== '' ? data.departmentId : undefined,
      },
      {
        onSuccess: (createdTask) => {
          onCreated?.(createdTask);
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
      title="Add new delegation"
      description="Define objectives, set priorities, and assign responsible members."
      bodyClassName="p-0"
      footer={<TaskFormFooter onClose={onClose} isPending={mutation.isPending} isSubmitting={isSubmitting} />}
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]" noValidate>
        <div className="flex flex-col gap-5 p-5 ">
          <Input
            id="title"
            label={<>Delegation Title <span className="text-danger">*</span></>}
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
            containerClassName="flex-1 min-h-0"
            rows={6}
            placeholder="Provide delegation context, constraints, acceptance criteria, or relevant links…"
            className="focus:border-primary-500 focus:ring-primary-500/20 h-full min-h-[100px] resize-none"
            labelClassName={FIELD_LABEL_CLASS}
            {...register('description')}
          />

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

          <div className="group/field flex flex-col gap-1.5">
            <label className={FIELD_LABEL_CLASS}>
              <CalendarRange className={FIELD_LABEL_ICON_CLASS} /> Start &amp; Due Date
            </label>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          <TaskFormDepartmentField
            value={departmentId ?? ''}
            onChange={(v) => setValue('departmentId', v)}
            departments={departments}
            isLoading={isLoadingDepts}
          />

          <TaskFormReminderField
            minutes={reminderMinutes}
            channel={reminderChannel}
            onChange={(minutes, next) => { setReminderMinutes(minutes); setReminderChannel(next); }}
          />
        </div>
      </form>
    </Modal>
  );
};
