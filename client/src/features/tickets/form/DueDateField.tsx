import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Input } from '../../../components';
import type { TicketFields } from './ticketFormSchema';

interface DueDateFieldProps {
  mode: 'MANUAL' | 'AUTO';
  register: UseFormRegister<TicketFields>;
  errors: FieldErrors<TicketFields>;
  categoryTatHours: number | null | undefined;
}

// Manual mode asks for an explicit due date/time; Auto mode shows the TAT that will be applied
// instead (the category's TAT if one is selected, otherwise the 24h default).
export const DueDateField = ({ mode, register, errors, categoryTatHours }: DueDateFieldProps) => (
  <AnimatePresence mode="wait">
    {mode === 'MANUAL' ? (
      <motion.div
        key="manual-tat"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        <Input
          id="dueDate"
          label="Due date"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          error={errors.dueDate?.message}
          className="font-display"
          {...register('dueDate')}
        />
        <Input
          id="dueTime"
          label="Due time"
          type="time"
          error={errors.dueTime?.message}
          className="font-display"
          {...register('dueTime')}
        />
      </motion.div>
    ) : (
      <motion.div
        key="auto-tat"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className="p-3 rounded-md bg-primary-500/5 border border-primary-500/20 text-xs text-primary-400 font-display flex items-center gap-2.5"
      >
        <Sparkles className="w-4 h-4 shrink-0 text-primary-400" />
        <span>
          Auto-assigned tickets are given a default TAT of{' '}
          <strong>{categoryTatHours ?? 24} hours</strong>
          {categoryTatHours ? ' (from this category)' : ''}.
        </span>
      </motion.div>
    )}
  </AnimatePresence>
);
