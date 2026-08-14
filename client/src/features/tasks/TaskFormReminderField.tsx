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
import type { Task } from '../../api/task';

export type ReminderChannel = Task['reminderChannel'];

const CHANNEL_LABEL: Record<ReminderChannel, string> = {
  notification: 'Notification',
  alarm: 'Alarm',
  email: 'Email',
  sms: 'SMS',
};

type ReminderUnit = 'days' | 'weeks' | 'months';

const UNIT_MINUTES: Record<ReminderUnit, number> = { days: 1440, weeks: 1440 * 7, months: 1440 * 30 };
const UNIT_LABEL: Record<ReminderUnit, string> = { days: 'Days', weeks: 'Weeks', months: 'Months' };

// Splits a stored minute count back into the largest whole unit that divides it evenly, so the
// amount + unit controls round-trip cleanly (e.g. 10080 minutes -> "1 Weeks", not "7 Days").
const splitMinutes = (minutes: number): { amount: number; unit: ReminderUnit } => {
  if (minutes % UNIT_MINUTES.months === 0) return { amount: minutes / UNIT_MINUTES.months, unit: 'months' };
  if (minutes % UNIT_MINUTES.weeks === 0) return { amount: minutes / UNIT_MINUTES.weeks, unit: 'weeks' };
  return { amount: Math.max(1, Math.round(minutes / UNIT_MINUTES.days)), unit: 'days' };
};

interface TaskFormReminderFieldProps {
  /** Minutes before the due date to remind — null/0 means no reminder wanted. */
  minutes: number | null;
  channel: ReminderChannel;
  onChange: (minutes: number | null, channel: ReminderChannel) => void;
  disabled?: boolean;
}

export const TaskFormReminderField = ({ minutes, channel, onChange, disabled = false }: TaskFormReminderFieldProps) => {
  const enabled = minutes !== null && minutes > 0;
  const { amount, unit } = enabled ? splitMinutes(minutes) : { amount: 1, unit: 'days' as ReminderUnit };

  return (
    <div className="group/field flex flex-col gap-1.5">
      <label className={FIELD_LABEL_CLASS}>
        <BellRing className={FIELD_LABEL_ICON_CLASS} /> Deadline Notification
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,4.5rem)_minmax(0,6.5rem)] gap-2">
        <Select
          value={channel}
          onValueChange={(v) => onChange(minutes, v as ReminderChannel)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 text-sm font-medium bg-surface border-border rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border shadow-lg rounded">
            {(Object.keys(CHANNEL_LABEL) as ReminderChannel[]).map((c) => (
              <SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          min={0}
          value={amount}
          disabled={disabled}
          onChange={(e) => {
            const next = Math.max(0, Number(e.target.value) || 0);
            onChange(next > 0 ? next * UNIT_MINUTES[unit] : null, channel);
          }}
          className="h-10 text-sm text-center px-2"
        />

        <Select
          value={unit}
          onValueChange={(v) => onChange(enabled ? amount * UNIT_MINUTES[v as ReminderUnit] : null, channel)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 text-sm font-medium bg-surface border-border rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border shadow-lg rounded">
            {(Object.keys(UNIT_LABEL) as ReminderUnit[]).map((u) => (
              <SelectItem key={u} value={u}>{UNIT_LABEL[u]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
