import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { GroupByControl, type GroupBy } from './GroupByControl';
import { TaskChecklistKpiSection } from './TaskChecklistKpiSection';
import { TicketKpiSection } from './TicketKpiSection';
import { ChecklistInstanceKpiSection } from './ChecklistInstanceKpiSection';
import type { DateRangeValue } from '../../../components';

// Intentionally uses the token theming system (bg-surface/text-text/border-border, matching
// features/dashboard and features/reports) rather than the raw-Tailwind style its features/admin
// siblings use — it reuses dashboard's token-based StatCard/chart conventions, which already
// handle light/dark correctly. Don't "fix" this to match the admin siblings.
export const AdminAnalytics = () => {
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [range, setRange] = useState<DateRangeValue>({ from: null, to: null });

  const from = range.from ? range.from.toISOString() : undefined;
  const to = range.to ? range.to.toISOString() : undefined;

  return (
    <main className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="flex flex-col gap-10 max-w-7xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-display font-bold tracking-tight text-text">Analytics</h1>
              <p className="text-sm font-display text-text-muted max-w-lg leading-relaxed">
                Completion rate and quality KPIs across tickets, checklists, and tasks — sliceable by day, week, month, or year.
              </p>
            </div>
          </div>

          <GroupByControl groupBy={groupBy} onGroupByChange={setGroupBy} range={range} onRangeChange={setRange} />
        </header>

        <TicketKpiSection groupBy={groupBy} from={from} to={to} />
        <TaskChecklistKpiSection groupBy={groupBy} from={from} to={to} />
        <ChecklistInstanceKpiSection groupBy={groupBy} from={from} to={to} />
      </div>
    </main>
  );
};
