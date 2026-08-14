import { useState } from 'react';
import { BarChart3, ClipboardCheck, Repeat, TicketCheck, Building2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GroupByControl, type GroupBy } from './GroupByControl';
import { TaskChecklistKpiSection } from './TaskChecklistKpiSection';
import { TicketKpiSection } from './TicketKpiSection';
import { ChecklistInstanceKpiSection } from './ChecklistInstanceKpiSection';
import { AnalyticsSummaryStrip } from './AnalyticsSummaryStrip';
import { StoresPerformanceSection } from './StoresPerformanceSection';
import type { DateRangeValue } from '../../../components';

const SECTION_TABS = [
  { value: 'checklists', label: 'Checklists', icon: ClipboardCheck },
  { value: 'audits', label: 'Audits', icon: Repeat },
  { value: 'issues', label: 'Issues', icon: TicketCheck },
  { value: 'stores', label: 'Stores', icon: Building2 },
] as const;

type SectionValue = (typeof SECTION_TABS)[number]['value'];

// Intentionally uses the token theming system (bg-surface/text-text/border-border, matching
// features/dashboard and features/reports) rather than the raw-Tailwind style its features/admin
// siblings use — it reuses dashboard's token-based StatCard/chart conventions, which already
// handle light/dark correctly. Don't "fix" this to match the admin siblings.
export const AdminAnalytics = () => {
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [range, setRange] = useState<DateRangeValue>({ from: null, to: null });
  const [section, setSection] = useState<SectionValue>('checklists');

  const from = range.from ? range.from.toISOString() : undefined;
  const to = range.to ? range.to.toISOString() : undefined;

  return (
    <main className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-display font-bold tracking-tight text-text">Analytics &amp; Dashboard</h1>
              <p className="text-sm font-display text-text-muted max-w-lg leading-relaxed">
                Checklist, audit, issue and store performance in one place.
              </p>
            </div>
          </div>

          <GroupByControl groupBy={groupBy} onGroupByChange={setGroupBy} range={range} onRangeChange={setRange} />
        </header>

        <AnalyticsSummaryStrip groupBy={groupBy} from={from} to={to} />

        <Tabs value={section} onValueChange={(v) => setSection(v as SectionValue)}>
          <TabsList className="bg-surface-hover p-1.5 rounded-xl gap-1.5 h-auto w-fit">
            {SECTION_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-2 px-4 py-2 rounded-lg font-display data-[state=active]:bg-primary-700 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="checklists" className="pt-6">
            <TaskChecklistKpiSection groupBy={groupBy} from={from} to={to} />
          </TabsContent>
          <TabsContent value="audits" className="pt-6">
            <ChecklistInstanceKpiSection groupBy={groupBy} from={from} to={to} />
          </TabsContent>
          <TabsContent value="issues" className="pt-6">
            <TicketKpiSection groupBy={groupBy} from={from} to={to} />
          </TabsContent>
          <TabsContent value="stores" className="pt-6">
            <StoresPerformanceSection groupBy={groupBy} from={from} to={to} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};
