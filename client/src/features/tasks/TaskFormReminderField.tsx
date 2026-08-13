import { BellRing } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '../../components';
import { FIELD_LABEL_CLASS, FIELD_LABEL_ICON_CLASS } from './taskFormFieldStyles';

type ReminderUnit = 'hours' | 'days';

const UNIT_MINUTES: Record<ReminderUnit, number> = { hours: 60, days: 1440 };

// Splits a stored minute count back into the largest whole unit (days if it divides evenly,
// hours otherwise) so the amount + unit controls round-trip cleanly for the common cases.
const splitMinutes = (minutes: number): { amount: number; unit: ReminderUnit } =>
  minutes % 1440 === 0 && minutes > 0
    ? { amount: minutes / 1440, unit: 'days' }
    : { amount: Math.max(1, Math.round(minutes / 60)), unit: 'hours' };

interface TaskFormReminderFieldProps {
  /** Minutes before the due date to remind — null means no reminder wanted. */
  minutes: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
}

export const TaskFormReminderField = ({ minutes, onChange, disabled = false }: TaskFormReminderFieldProps) => {
  const enabled = minutes !== null && minutes > 0;
  const { amount, unit } = enabled ? splitMinutes(minutes) : { amount: 1, unit: 'days' as ReminderUnit };

  return (
    <div className="group/field flex flex-col gap-1.5">
      <label className={FIELD_LABEL_CLASS}>
        <BellRing className={FIELD_LABEL_ICON_CLASS} /> Deadline Reminder
      </label>
      <div className="grid grid-cols-[1fr_4.5rem_6.5rem] gap-2">
        <Select
          value={enabled ? 'on' : 'off'}
          onValueChange={(v) => onChange(v === 'on' ? amount * UNIT_MINUTES[unit] : null)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 text-sm font-medium bg-surface border-border rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border shadow-lg rounded">
            <SelectItem value="off">No reminder</SelectItem>
            <SelectItem value="on">Remind me</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          min={1}
          value={amount}
          disabled={disabled || !enabled}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1) * UNIT_MINUTES[unit])}
          className="h-10 text-sm text-center px-2"
        />

        <Select
          value={unit}
          onValueChange={(v) => onChange(amount * UNIT_MINUTES[v as ReminderUnit])}
          disabled={disabled || !enabled}
        >
          <SelectTrigger className="h-10 text-sm font-medium bg-surface border-border rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border shadow-lg rounded">
            <SelectItem value="hours">Hours before</SelectItem>
            <SelectItem value="days">Days before</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
