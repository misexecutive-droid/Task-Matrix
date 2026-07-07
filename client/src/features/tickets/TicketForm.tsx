import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Input, Button } from '../../components';
import { useCreateTicketMutation, useAssignableUsersQuery } from './hook';
import { useAuth } from '../../context/AuthContext';

const ticketSchema = z.object({
  title:          z.string().min(1, 'Title is required'),
  description:    z.string().min(1, 'Description is required'),
  priority:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignmentMode: z.enum(['AUTO', 'MANUAL']),
  assigneeId:     z.string().optional().or(z.literal('')),
  tatHours:       z.string().optional().refine(v => !v || Number(v) > 0, 'Must be a positive number'),
});

type TicketFields = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onClose: () => void;
}

export const TicketForm = ({ onClose }: TicketFormProps) => {
  const { user } = useAuth();
  const canAssign = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const { data: assignableUsers } = useAssignableUsersQuery();
  const mutation = useCreateTicketMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TicketFields>({
    resolver:      zodResolver(ticketSchema),
    defaultValues: { priority: 'MEDIUM', assignmentMode: 'MANUAL' },
  });

  const assignmentMode = watch('assignmentMode');

  const onSubmit = (data: TicketFields) => {
    mutation.mutate(
      {
        title:          data.title,
        description:    data.description,
        priority:       data.priority,
        assignmentMode: data.assignmentMode,
        assigneeId:     data.assigneeId !== '' ? data.assigneeId : undefined,
        tatHours:       data.tatHours ? Number(data.tatHours) : undefined,
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
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col gap-6 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-slate-900">New ticket</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            id="title"
            label="Title"
            placeholder="e.g. Fix login issue on mobile"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-display text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe the issue or request…"
              className="w-full px-3 py-2.5 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 placeholder:text-slate-400 resize-none transition-colors"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="priority" className="text-sm font-display text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-3 h-11 sm:h-10 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 transition-colors cursor-pointer"
                {...register('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="assignmentMode" className="text-sm font-display text-slate-700">
                Assignment
              </label>
              <select
                id="assignmentMode"
                className="w-full px-3 h-11 sm:h-10 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 transition-colors cursor-pointer"
                {...register('assignmentMode')}
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTO">Auto</option>
              </select>
            </div>
          </div>

          {canAssign && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="assigneeId" className="text-sm font-display text-slate-700">
                Assign to (optional)
              </label>
              <select
                id="assigneeId"
                className="w-full px-3 h-11 sm:h-10 text-sm bg-white rounded-sm border border-slate-300 focus:outline-none focus:border-2 focus:border-blue-700 transition-colors cursor-pointer"
                {...register('assigneeId')}
              >
                <option value="">Unassigned</option>
                {assignableUsers?.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName ?? ''} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignmentMode === 'MANUAL' && (
            <Input
              id="tatHours"
              label="TAT hours (optional)"
              type="number"
              placeholder="e.g. 24"
              error={errors.tatHours?.message}
              {...register('tatHours')}
            />
          )}

          {mutation.isError && (
            <p className="text-xs text-red-500 text-center">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to create ticket.'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>
              Create ticket
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
