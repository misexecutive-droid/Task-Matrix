import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import { Input, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateTicketMutation, useAssignableUsersQuery, useDepartmentsQuery } from './hook';

const ticketSchema = z.object({
  title:          z.string().min(1, 'Title is required'),
  description:    z.string().min(1, 'Description is required'),
  priority:       z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignmentMode: z.enum(['AUTO', 'MANUAL']),
  departmentId:   z.string().optional().or(z.literal('')),
  assigneeId:     z.string().optional().or(z.literal('')),
  tatHours:       z.string().optional().refine(v => !v || Number(v) > 0, 'Must be a positive number'),
});


type TicketFields = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onClose: () => void;
}

const SELECT_CLASS = 'w-full px-3 h-11 sm:h-10 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 transition-colors cursor-pointer';
const LABEL_CLASS = 'text-sm font-display font-medium text-text-secondary';

export const TicketForm = ({ onClose }: TicketFormProps) => {
  const { data: departments } = useDepartmentsQuery();
  const mutation = useCreateTicketMutation();


    const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TicketFields>({
    resolver:      zodResolver(ticketSchema),
    defaultValues: { priority: 'MEDIUM', assignmentMode: 'MANUAL' },
  });

  const assignmentMode = watch('assignmentMode');
  const departmentId   = watch('departmentId');
  const { data: assignableUsers } = useAssignableUsersQuery(departmentId || undefined);

  useEffect(() => {
    setValue('assigneeId', '');
  }, [departmentId, setValue]);

  const onSubmit = (data: TicketFields) => {
    mutation.mutate(
      {
        title:          data.title,
        description:    data.description,
        priority:       data.priority,
        assignmentMode: data.assignmentMode,
        departmentId:   data.departmentId !== '' ? data.departmentId : undefined,
        assigneeId:     data.assigneeId !== '' ? data.assigneeId : undefined,
        tatHours:       data.tatHours ? Number(data.tatHours) : (data.assignmentMode === 'AUTO' ? 24 : undefined),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            id="title"
            label="Title"
            placeholder="e.g. Fix login issue on mobile"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className={LABEL_CLASS}>
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe the issue or request…"
              className="w-full px-3 py-2.5 text-sm bg-surface text-text rounded-sm border border-border focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 placeholder:text-text-light resize-none transition-colors"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-danger">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="priority" className={LABEL_CLASS}>
                Priority
              </label>
              <select
                id="priority"
                className={SELECT_CLASS}
                {...register('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="assignmentMode" className={LABEL_CLASS}>
                Assignment
              </label>
              <select
                id="assignmentMode"
                className={SELECT_CLASS}
                {...register('assignmentMode')}
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTO">Auto</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="departmentId" className={LABEL_CLASS}>
              Department (optional)
            </label>
            <select
              id="departmentId"
              className={SELECT_CLASS}
              {...register('departmentId')}
            >
              <option value="">Any department</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="assigneeId" className={LABEL_CLASS}>
              Assign to (optional)
            </label>
            <select
              id="assigneeId"
              className={SELECT_CLASS}
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

          {assignmentMode === 'MANUAL' ? (
            <Input
              id="tatHours"
              label="TAT hours (optional)"
              type="number"
              placeholder="e.g. 24"
              error={errors.tatHours?.message}
              {...register('tatHours')}
            />
          ) : (
            <p className="text-xs text-text-muted font-display -mt-1">
              Auto-assigned tickets get a default TAT of 24 hours.
            </p>
          )}

          {mutation.isError && (
            <p className="text-xs text-danger text-center">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to create ticket.'}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>
              Create ticket
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};