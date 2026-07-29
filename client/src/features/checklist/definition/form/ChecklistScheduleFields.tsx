import { Building2, Repeat, Calendar } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { LABEL_CLASS, INPUT_BASE_CLASS, SELECT_TRIGGER_CLASS, RECURRENCE_OPTIONS } from './formConstants';
import type { ChecklistRecurrence } from '../../../../api/checklistDefinitions';
import type { Department } from '../../../../api/departments';

interface ChecklistScheduleFieldsProps {
  departmentId: string;
  onDepartmentChange: (id: string) => void;
  departments: Department[] | undefined;
  recurrence: ChecklistRecurrence;
  onRecurrenceChange: (value: ChecklistRecurrence) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
}

// Department, recurrence, and start/due date — everything that decides when and where the
// checklist runs.
export const ChecklistScheduleFields = ({
  departmentId,
  onDepartmentChange,
  departments,
  recurrence,
  onRecurrenceChange,
  startDate,
  onStartDateChange,
}: ChecklistScheduleFieldsProps) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className={LABEL_CLASS}>
          <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Department
        </label>
        <Select value={departmentId} onValueChange={onDepartmentChange}>
          <SelectTrigger className={SELECT_TRIGGER_CLASS}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
            {departments?.map((d) => (
              <SelectItem key={d.id} value={d.id} className="font-display text-xs">
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className={LABEL_CLASS}>
          <Repeat className="w-3.5 h-3.5 text-amber-400" /> Recurrence
        </label>
        <Select value={recurrence} onValueChange={(v) => onRecurrenceChange(v as ChecklistRecurrence)}>
          <SelectTrigger className={SELECT_TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface/95 backdrop-blur-md border-border/60">
            {RECURRENCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="font-display text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="checklist-start-date" className={LABEL_CLASS}>
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        {recurrence === 'ONE_TIME' ? 'Due Date' : 'Starts On'}
      </label>
      <input
        id="checklist-start-date"
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className={`${INPUT_BASE_CLASS} h-10 cursor-pointer text-text-secondary`}
      />
    </div>
  </>
);
