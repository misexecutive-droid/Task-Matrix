import { Store, Calendar, Clock } from 'lucide-react';
import { StoreMultiSelect, Input } from '../../../../components';
import type { ChecklistRecurrence } from '../../../../api/checklistDefinitions';

const RECURRENCE_OPTIONS: { value: ChecklistRecurrence; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One-time' },
];

interface BuilderSchedulePanelProps {
  storeIds: string[];
  onStoreIdsChange: (ids: string[]) => void;
  recurrence: ChecklistRecurrence;
  onRecurrenceChange: (value: ChecklistRecurrence) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  opensTime: string;
  onOpensTimeChange: (value: string) => void;
  cutoffTime: string;
  onCutoffTimeChange: (value: string) => void;
}

export const BuilderSchedulePanel = ({
  storeIds, onStoreIdsChange,
  recurrence, onRecurrenceChange,
  startDate, onStartDateChange,
  opensTime, onOpensTimeChange,
  cutoffTime, onCutoffTimeChange,
}: BuilderSchedulePanelProps) => (
  <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border bg-surface">
    <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Schedule</h2>

    <div className="space-y-2">
      <label className="text-xs font-display font-semibold text-text-secondary flex items-center gap-1.5">
        <Store size={13} className="text-emerald-500" /> Stores
      </label>
      <StoreMultiSelect selected={storeIds} onChange={onStoreIdsChange} />
    </div>

    <div className="flex flex-wrap gap-1.5">
      {RECURRENCE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onRecurrenceChange(opt.value)}
          className={[
            'px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-colors cursor-pointer',
            recurrence === opt.value
              ? 'bg-primary-700 text-white shadow-sm'
              : 'border border-border text-text-secondary hover:bg-surface-hover',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>

    <Input
      id="builder-start-date"
      type="date"
      label={recurrence === 'ONE_TIME' ? 'Due Date' : 'Starts On'}
      icon={Calendar}
      iconClassName="text-primary-500"
      value={startDate}
      onChange={e => onStartDateChange(e.target.value)}
      className="cursor-pointer text-text-secondary"
    />

    <div className="grid grid-cols-2 gap-3">
      <Input
        id="builder-opens-time"
        type="time"
        label="Opens"
        icon={Clock}
        iconClassName="text-emerald-500"
        value={opensTime}
        onChange={e => onOpensTimeChange(e.target.value)}
        className="cursor-pointer text-text-secondary"
      />
      <Input
        id="builder-cutoff-time"
        type="time"
        label="Cut-off"
        icon={Clock}
        iconClassName="text-danger"
        value={cutoffTime}
        onChange={e => onCutoffTimeChange(e.target.value)}
        className="cursor-pointer text-text-secondary"
      />
    </div>
  </div>
);
