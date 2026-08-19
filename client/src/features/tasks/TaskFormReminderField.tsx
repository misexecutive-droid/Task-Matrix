import { BellRing, ChevronDown } from 'lucide-react';
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

// A plain native <select> rather than the Radix-based Select — this field sits in a narrow,
// fixed-width grid column where Combobox's search input doesn't fit, and native <select> also
// sidesteps Radix Select's portal conflict with our Dialog-based Modal (see Combobox's own
// "no portal" comment for the same reasoning).
const NATIVE_SELECT_CLASS =
  'h-10 w-full appearance-none text-sm font-medium bg-surface border border-border rounded shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all pl-2.5 pr-7 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

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
        <div className="relative">
          <select
            value={channel}
            onChange={(e) => onChange(minutes, e.target.value as ReminderChannel)}
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
          >
            {(Object.keys(CHANNEL_LABEL) as ReminderChannel[]).map((c) => (
              <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light pointer-events-none" />
        </div>

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

        <div className="relative">
          <select
            value={unit}
            onChange={(e) => onChange(enabled ? amount * UNIT_MINUTES[e.target.value as ReminderUnit] : null, channel)}
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
          >
            {(Object.keys(UNIT_LABEL) as ReminderUnit[]).map((u) => (
              <option key={u} value={u}>{UNIT_LABEL[u]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
