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
  <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-surface shadow-xs hover:shadow-sm transition-shadow duration-300">
    <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Schedule</h2>

    <div className="space-y-3">
      <label className="text-xs font-display font-semibold text-text-secondary flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-success/10">
          <Store size={14} className="text-success" />
        </div>
        Stores
      </label>
      <StoreMultiSelect selected={storeIds} onChange={onStoreIdsChange} />
    </div>

    <hr className="border-border/50 my-1" />

    <div className="flex flex-wrap gap-2">
      {RECURRENCE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onRecurrenceChange(opt.value)}
          aria-pressed={recurrence === opt.value}
          className={[
            'px-4 py-2 rounded-full text-xs font-display font-semibold transition-all duration-200 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            recurrence === opt.value
              ? 'bg-primary-700 text-white shadow-sm'
              : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:border-border-hover',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>

    <div className="flex flex-col gap-4 mt-2">
      <Input
        id="builder-start-date"
        type="date"
        label={recurrence === 'ONE_TIME' ? 'Due Date' : 'Starts On'}
        icon={Calendar}
        iconClassName="text-primary-500"
        value={startDate}
        onChange={e => onStartDateChange(e.target.value)}
        className="cursor-pointer text-text-secondary transition-all duration-150 hover:border-primary-300 focus:ring-primary-500"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="builder-opens-time"
          type="time"
          label="Opens"
          icon={Clock}
          iconClassName="text-success"
          value={opensTime}
          onChange={e => onOpensTimeChange(e.target.value)}
          className="cursor-pointer text-text-secondary transition-all duration-150 hover:border-success/40 focus:ring-success"
        />
        <Input
          id="builder-cutoff-time"
          type="time"
          label="Cut-off"
          icon={Clock}
          iconClassName="text-danger"
          value={cutoffTime}
          onChange={e => onCutoffTimeChange(e.target.value)}
          className="cursor-pointer text-text-secondary transition-all duration-150 hover:border-danger/50 focus:ring-danger"
        />
      </div>
    </div>
  </div>
);
