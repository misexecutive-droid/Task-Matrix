import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input, Textarea } from '../../../components';
import type { TicketFields } from './ticketFormSchema';

interface TicketDetailsFieldsProps {
  register: UseFormRegister<TicketFields>;
  errors: FieldErrors<TicketFields>;
}

export const TicketDetailsFields = ({ register, errors }: TicketDetailsFieldsProps) => (
  <>
    <Input
      id="title"
      label="Title"
      placeholder="e.g. Fix authentication timeout on mobile"
      error={errors.title?.message}
      className="font-display"
      {...register('title')}
    />

    <Textarea
      id="description"
      label="Description"
      rows={3}
      placeholder="Describe the issue or expectations…"
      className="font-display"
      error={errors.description?.message}
      {...register('description')}
    />
  </>
);
