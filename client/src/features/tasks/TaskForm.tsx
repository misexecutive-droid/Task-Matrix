import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { X } from 'lucide-react';
import { Input, Button } from '../../components';
import { useCreateTaskMutation, useAssignableUsersQuery } from './hook';

// ── Schema ─────────────────────────────────────────────────────
const taskSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority:    z.enum(['low', 'medium', 'high']),
  dueDate:     z.string().optional(),
  // NEW — the <select> below always submits a string (the "Unassigned" option submits ''),
  // so we accept a plain optional string here and convert '' -> undefined manually in onSubmit,
  // the same pattern already used for departmentId/assigneeId in TicketForm.tsx.
  assigneeId:  z.string().optional(),
});

type TaskFields = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
}

export const TaskForm = ({ onClose }: TaskFormProps) => {
  const mutation = useCreateTaskMutation();
  const { data: assignableUsers } = useAssignableUsersQuery(); // NEW

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium' },
  });

  const onSubmit = (data: TaskFields) => {
    mutation.mutate(
      {
        ...data,
        // NEW: turn the "Unassigned" option's empty string into `undefined` so it's left out
        // of the JSON body entirely, rather than sending assigneeId: "" (which would fail the
        // server's ObjectId regex check and come back as a 400 Validation error).
        assigneeId: data.assigneeId !== '' ? data.assigneeId : undefined,
        // The <input type="date"> gives a plain "YYYY-MM-DD" (or "" when empty), but the server
        // requires a full ISO-8601 datetime (z.string().datetime() in task.validation.ts) — so
        // convert to an ISO string here, or omit the field entirely when left blank.
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (

    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      {/* Modal card — stop click propagating to backdrop */}
      <div
        className="w-full max-w-md bg-surface rounded-xl shadow-2xl border border-border flex flex-col gap-6 p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-text">New task</h2>
          <button
            onClick={onClose}
            className="text-text-light hover:text-text transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            id="title"
            label="Title"
            placeholder="e.g. Design the landing page"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Description — plain textarea styled like Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-display font-medium text-text-secondary">
              Description <span className="text-text-light">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Add more detail…"
              className="w-full px-3 py-2.5 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 placeholder:text-text-light resize-none transition-colors"
              {...register('description')}
            />
          </div>

          {/* Priority + Due date side by side */}
          <div className="grid grid-cols-2 gap-3">

            {/* Priority select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="priority" className="text-sm font-display font-medium text-text-secondary">
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 h-11 sm:h-10 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 transition-colors cursor-pointer"
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <Input
              id="dueDate"
              label="Due date"
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />

          </div>

          {/* NEW — Assign to (optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assigneeId" className="text-sm font-display font-medium text-text-secondary">
              Assign to <span className="text-text-light">(optional)</span>
            </label>
            <select
              id="assigneeId"
              className="w-full px-3 h-11 sm:h-10 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 transition-colors cursor-pointer"
              {...register('assigneeId')}
            >
              <option value="">Unassigned (just for me)</option>
              {assignableUsers?.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName ?? ''} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* API error */}
          {mutation.isError && (
            <p className="text-xs text-danger text-center">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Failed to create task.'}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={mutation.isPending}
            >
              Create task
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
