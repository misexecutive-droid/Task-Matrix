import { useMemo, useState } from 'react';
import { BarChart3, ClipboardCheck, Repeat, TicketCheck, Building2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '../../../context/AuthContext';
import { useDepartmentsQuery, useStoresQuery, useTicketsQuery } from '../../tickets/hook';
import { useTasksQuery } from '../../tasks/hook';
import { GroupByControl, type GroupBy } from './GroupByControl';
import { TaskChecklistKpiSection } from './TaskChecklistKpiSection';
import { TicketKpiSection } from './TicketKpiSection';
import { ChecklistInstanceKpiSection } from './ChecklistInstanceKpiSection';
import { AnalyticsSummaryStrip } from './AnalyticsSummaryStrip';
import { StoresPerformanceSection } from './StoresPerformanceSection';
import { QuickActionsGrid } from '../overview/QuickActionsGrid';
import { RecentActivity } from '../../dashboard/RecentActivity';
import type { FeedItem } from '../../dashboard/dashboardDisplay';
import { LightBeams, type DateRangeValue } from '../../../components';

const ALL_SECTION_TABS = [
  { value: 'checklists', label: 'Checklists', icon: ClipboardCheck },
  { value: 'audits', label: 'Audits', icon: Repeat },
  { value: 'issues', label: 'Issues', icon: TicketCheck },
  { value: 'stores', label: 'Stores', icon: Building2 },
] as const;

type SectionValue = (typeof ALL_SECTION_TABS)[number]['value'];

// Comparing performance *across* stores/departments is an org-wide (MD) view — a department
// head or store lead only needs their own numbers, not a cross-entity leaderboard. It also
// depends on the ADMIN/PC-only /users list endpoint, which isn't opened up further here.
const canSeeStoresTab = (role?: string) => role === 'ADMIN' || role === 'PC';

// Intentionally uses the token theming system (bg-surface/text-text/border-border, matching
// features/dashboard and features/reports) rather than the raw-Tailwind style its features/admin
// siblings use — it reuses dashboard's token-based StatCard/chart conventions, which already
// handle light/dark correctly. Don't "fix" this to match the admin siblings.
export const OrgOverview = () => {
  const { user } = useAuth();
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [range, setRange] = useState<DateRangeValue>({ from: null, to: null });

  const sectionTabs = useMemo(
    () => (canSeeStoresTab(user?.role) ? ALL_SECTION_TABS : ALL_SECTION_TABS.filter((t) => t.value !== 'stores')),
    [user?.role]
  );
  const [section, setSection] = useState<SectionValue>('checklists');

  const from = range.from ? range.from.toISOString() : undefined;
  const to = range.to ? range.to.toISOString() : undefined;

  const { data: departments } = useDepartmentsQuery();
  const { data: stores } = useStoresQuery();
  const scopeLabel = useMemo(() => {
    if (user?.role === 'MANAGER') {
      const dept = departments?.find((d) => d.id === user.departmentId);
      return dept ? `Department: ${dept.name}` : 'Department: unassigned';
    }
    if (user?.role === 'SENIOR') {
      const store = stores?.find((s) => s.id === user.storeId);
      return store ? `Store: ${store.name}` : 'Store: unassigned';
    }
    return 'Org-wide';
  }, [user, departments, stores]);

  const { data: ticketPage, isPending: ticketsPending } = useTicketsQuery(1, 100);
  const { data: tasks, isPending: tasksPending } = useTasksQuery();
  const tickets = ticketPage?.data ?? [];
  const isFeedPending = ticketsPending || tasksPending;
  const feed: FeedItem[] = [
    ...tickets.map((t): FeedItem => ({ kind: 'ticket', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
    ...(tasks ?? []).map((t): FeedItem => ({ kind: 'task', id: t.id, title: t.title, status: t.status, createdAt: t.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <main className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <header className="relative isolate overflow-hidden flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border">
          <LightBeams />
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-display font-bold tracking-tight text-text">Overview</h1>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-display font-semibold bg-primary-500/10 text-primary-700 dark:text-primary-400">
                  {scopeLabel}
                </span>
              </div>
              <p className="text-sm font-display text-text-muted max-w-lg leading-relaxed">
                Checklist, audit, issue and store performance in one place.
              </p>
            </div>
          </div>

          <GroupByControl groupBy={groupBy} onGroupByChange={setGroupBy} range={range} onRangeChange={setRange} />
        </header>

        <AnalyticsSummaryStrip groupBy={groupBy} from={from} to={to} />

        {canSeeStoresTab(user?.role) && <QuickActionsGrid />}

        <Tabs value={section} onValueChange={(v) => setSection(v as SectionValue)}>
          <TabsList className="bg-surface-hover p-1.5 rounded-xl gap-1.5 h-auto w-fit">
            {sectionTabs.map(({ value, label, icon: Icon }) => (
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
          {canSeeStoresTab(user?.role) && (
            <TabsContent value="stores" className="pt-6">
              <StoresPerformanceSection groupBy={groupBy} from={from} to={to} />
            </TabsContent>
          )}
        </Tabs>

        <RecentActivity feed={feed} isPending={isFeedPending} />
      </div>
    </main>
  );
};
