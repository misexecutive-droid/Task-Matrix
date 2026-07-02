import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { X } from 'lucide-react';
import { Input, Button } from '../../components';
import { useCreateTaskMutation } from './hook';

// ── Schema ─────────────────────────────────────────────────────
const taskSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate:     z.string().optional(),
});

type TaskFields = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onClose: () => void;
}

export const TaskForm = ({ onClose }: TaskFormProps) => {
  const mutation = useCreateTaskMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium' },
  });

  const onSubmit = (data: TaskFields) => {
    mutation.mutate(data, {
      onSuccess: () => onClose(), 
    });
  };

  return (
    
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      {/* Modal card — stop click propagating to backdrop */}
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col gap-6 p-6"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-slate-900">New task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
            <label htmlFor="description" className="text-sm font-display text-slate-700">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Add more detail…"
              className="w-full px-3 py-2.5 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 placeholder:text-slate-400 resize-none transition-colors"
              {...register('description')}
            />
          </div>

          {/* Priority + Due date side by side */}
          <div className="grid grid-cols-2 gap-3">

            {/* Priority select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="priority" className="text-sm font-display text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 h-11 sm:h-10 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 transition-colors cursor-pointer"
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

          {/* API error */}
          {mutation.isError && (
            <p className="text-xs text-red-500 text-center">
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
