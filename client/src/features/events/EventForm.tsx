import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock } from 'lucide-react';
import { Input, Textarea, Button } from '../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCreateEventMutation, useUpdateEventMutation } from './hook';
import { EVENT_TYPE_LABELS } from './eventDisplay';
import type { Event, EventType } from '@/api/events';

const EVENT_TYPES: EventType[] = ['DEADLINE', 'ANNOUNCEMENT', 'BROADCAST'];

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in LOCAL time, not the ISO string's UTC form.
const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['DEADLINE', 'ANNOUNCEMENT', 'BROADCAST']),
  eventDate: z.string().min(1, 'Date & time is required'),
});

type EventFields = z.infer<typeof eventSchema>;

interface EventFormProps {
  onClose: () => void;
  event?: Event;
}

export const EventForm = ({ onClose, event }: EventFormProps) => {
  const isEditing = !!event;
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFields>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      type: event?.type ?? 'ANNOUNCEMENT',
      eventDate: event ? toLocalInputValue(event.eventDate) : '',
    },
  });

  const onSubmit = (data: EventFields) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      eventDate: new Date(data.eventDate).toISOString(),
    };

    if (isEditing) {
      updateMutation.mutate({ id: event.id, payload }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-primary-500 shrink-0" />
            <div>
              <DialogTitle>{isEditing ? 'Edit event' : 'New event'}</DialogTitle>
              <p className="text-xs text-text-muted mt-0.5">
                Deadlines, announcements, and broadcasts show up on everyone's dashboard.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            id="title"
            label="Title"
            placeholder="e.g. Payroll cutoff"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="type" className="text-sm font-display font-medium text-text-secondary">
              Type
            </label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type" className="w-full h-10 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Input
            id="eventDate"
            type="datetime-local"
            label="Date & time"
            error={errors.eventDate?.message}
            {...register('eventDate')}
          />

          <Textarea
            id="description"
            label="Description"
            rows={3}
            placeholder="Optional details"
            {...register('description')}
          />

          {mutation.isError && (
            <p className="text-xs text-danger text-center">
              {mutation.error instanceof Error ? mutation.error.message : `Failed to ${isEditing ? 'update' : 'create'} event.`}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>{isEditing ? 'Save changes' : 'Create event'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
