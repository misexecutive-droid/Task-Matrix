import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker, type DateRangeValue } from '../../../components';

export type GroupBy = 'day' | 'week' | 'month' | 'year';

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

interface GroupByControlProps {
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  range: DateRangeValue;
  onRangeChange: (range: DateRangeValue) => void;
}

export const GroupByControl = ({ groupBy, onGroupByChange, range, onRangeChange }: GroupByControlProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <Tabs value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupBy)}>
      <TabsList>
        {GROUP_BY_OPTIONS.map((o) => (
          <TabsTrigger key={o.value} value={o.value}>
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    <DateRangePicker value={range} onChange={onRangeChange} placeholder="Custom range" className="w-full sm:w-64" />
  </div>
);
