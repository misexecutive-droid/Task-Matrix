import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { X, Calendar, User, Building2, Flag } from 'lucide-react';
import { Input, Button } from '../../components';
import { useCreateTaskMutation, useAssignableUsersQuery } from './hook';
import { useDepartmentsQuery } from '../tickets/hook';

// ── Schema ─────────────────────────────────────────────────────
// Using Zod transforms directly keeps the submission handler clean
// and centralizes all data-sanitization logic.
const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val).toISOString() : undefined)),
  assigneeId: z
    .string()
    .optional()
    .transform((val) => (val !== '' ? val : undefined)),
  departmentId: z
    .string()
    .optional()
    .transform((val) => (val !== '' ? val : undefined)),
});

type TaskFields = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
}

export const TaskForm = ({ onClose }: TaskFormProps) => {
  const mutation = useCreateTaskMutation();
  const { data: assignableUsers, isLoading: isLoadingUsers } = useAssignableUsersQuery();
  const { data: departments, isLoading: isLoadingDepts } = useDepartmentsQuery();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      assigneeId: '',
      departmentId: '',
    },
  });

  const onSubmit = (data: TaskFields) => {
    // Data is already sanitized (transformed to ISO string / undefined) by Zod
    mutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Card */}
      <div
        className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border flex flex-col p-6 max-h-[90vh] overflow-y-auto transition-all transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/50">
          <div>
            <h2 id="modal-title" className="text-lg font-display font-semibold text-text">
              Create New Task
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Add details to track and assign this work unit.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {/* Title */}
          <Input
            id="title"
            label="Task Title"
            placeholder="e.g. Design the landing page hero section"
            error={errors.title?.message}
            {...register('title')}
            autoFocus
          />

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-display font-medium text-text-secondary flex justify-between">
              <span>Description</span>
              <span className="text-text-muted font-normal">Optional</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Provide context, constraints, or helpful links…"
              className="w-full px-3 py-2 text-sm bg-surface text-text rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-text-muted/60 resize-none transition-all"
              {...register('description')}
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="priority" className="text-xs font-display font-medium text-text-secondary flex items-center gap-1">
                <Flag size={12} className="text-text-muted" />
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 h-10 text-sm bg-surface text-text rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dueDate" className="text-xs font-display font-medium text-text-secondary flex items-center gap-1">
                <Calendar size={12} className="text-text-muted" />
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                className="w-full px-3 h-10 text-sm bg-surface text-text rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                {...register('dueDate')}
              />
              {errors.dueDate?.message && (
                <span className="text-[11px] text-danger">{errors.dueDate.message}</span>
              )}
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assigneeId" className="text-xs font-display font-medium text-text-secondary flex items-center gap-1">
              <User size={12} className="text-text-muted" />
              Assignee
            </label>
            <select
              id="assigneeId"
              disabled={isLoadingUsers}
              className="w-full px-3 h-10 text-sm bg-surface text-text rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer disabled:opacity-60"
              {...register('assigneeId')}
            >
              <option value="">Unassigned</option>
              {assignableUsers?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName ?? ''} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="departmentId" className="text-xs font-display font-medium text-text-secondary flex items-center gap-1">
              <Building2 size={12} className="text-text-muted" />
              Department
            </label>
            <select
              id="departmentId"
              disabled={isLoadingDepts}
              className="w-full px-3 h-10 text-sm bg-surface text-text rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer disabled:opacity-60"
              {...register('departmentId')}
            >
              <option value="">No department</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Error Callout */}
          {mutation.isError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-medium text-center">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Failed to create task. Please try again.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={mutation.isPending || isSubmitting}
            >
              Create task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};