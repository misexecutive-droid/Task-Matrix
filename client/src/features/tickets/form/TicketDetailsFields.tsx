import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { Input } from '../../../components';
import { LABEL_CLASS } from './formConstants';
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

    <div className="flex flex-col gap-2">
      <label htmlFor="description" className={LABEL_CLASS}>
        Description
      </label>
      <textarea
        id="description"
        rows={3}
        placeholder="Describe the issue or expectations…"
        className="w-full px-3 py-2.5 text-base sm:text-sm font-display bg-surface text-text rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-text-muted/60 resize-none transition-all hover:border-border/80"
        {...register('description')}
      />
      {errors.description && (
        <p className="text-xs text-rose-500 flex items-center gap-1 font-display">
          <AlertCircle className="w-3 h-3" /> {errors.description.message}
        </p>
      )}
    </div>
  </>
);
