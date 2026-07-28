import { useState } from 'react';
import { Ticket as TicketIcon, CheckSquare, AlertTriangle, Sparkles } from 'lucide-react';
import { Skeleton } from '../../components';
import { MetricCell } from './MetricCell';
import { ActivityTrendChart } from './ActivityTrendChart';

interface Tab {
  key: string;
  label: string;
  value: number;
  color: string;
  data: number[];
}

interface DashboardOverviewProps {
  isPending: boolean;
  isAdmin: boolean;
  openTickets: number;
  openTasks: number;
  overdueCount: number;
  newThisWeek: number;
  dates: Date[];
  trendTickets: number[];
  trendTasks: number[];
  trendOverdue: number[];
  trendNew: number[];
}

export const DashboardOverview = ({
  isPending,
  isAdmin,
  openTickets,
  openTasks,
  overdueCount,
  newThisWeek,
  dates,
  trendTickets,
  trendTasks,
  trendOverdue,
  trendNew,
}: DashboardOverviewProps) => {
  const tabs: Tab[] = [
    { key: 'tickets', label: isAdmin ? 'All tickets' : 'My tickets', value: openTickets, color: 'var(--color-primary-500)', data: trendTickets },
    { key: 'tasks', label: isAdmin ? 'All tasks' : 'My tasks', value: openTasks, color: '#f59e0b', data: trendTasks },
    { key: 'overdue', label: 'Overdue', value: overdueCount, color: '#e11d48', data: trendOverdue },
    { key: 'new', label: 'New this week', value: newThisWeek, color: '#059669', data: trendNew },
  ];

  const [activeKey, setActiveKey] = useState(tabs[0].key);
  const activeTab = tabs.find(t => t.key === activeKey) ?? tabs[0];

  if (isPending) {
    return (
      <div className="rounded-lg border border-border bg-surface grid grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-2 grid grid-cols-2 border-b lg:border-b-0 lg:border-r border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-10 rounded-md" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-3 p-5">
          <Skeleton className="h-44 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface grid grid-cols-1 lg:grid-cols-5">
      {/* Metric grid */}
      <div className="lg:col-span-2 grid grid-cols-2 border-b lg:border-b-0 lg:border-r border-border">
        <MetricCell
          icon={TicketIcon}
          iconTint="bg-primary-500/10 text-primary-600 dark:text-primary-300"
          label={isAdmin ? 'All tickets' : 'My open tickets'}
          value={openTickets}
          linkTo="/tickets"
          linkPrefix="See all"
          linkLabel="tickets"
          className="border-r border-b border-border"
        />
        <MetricCell
          icon={CheckSquare}
          iconTint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label={isAdmin ? 'All tasks' : 'My open tasks'}
          value={openTasks}
          linkTo="/tasks"
          linkPrefix="See all"
          linkLabel="tasks"
          className="border-b border-border"
        />
        <MetricCell
          icon={AlertTriangle}
          iconTint="bg-danger/10 text-danger"
          label={isAdmin ? 'Overdue (org-wide)' : 'My overdue'}
          value={overdueCount}
          linkTo="/tickets"
          linkPrefix="Review"
          linkLabel="overdue items"
          className="border-r border-border"
        />
        <MetricCell
          icon={Sparkles}
          iconTint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label="New this week"
          value={newThisWeek}
          linkTo="#recent-activity"
          linkPrefix="See"
          linkLabel="recent activity"
        />
      </div>

      {/* Tabbed trend chart */}
      <div className="lg:col-span-3 flex flex-col gap-5 p-5">
        <div className="flex items-center gap-6 flex-wrap border-b border-border pb-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              className="flex flex-col items-start gap-1.5 cursor-pointer"
            >
              <span
                className={`text-xs font-display font-medium transition-colors ${
                  tab.key === activeTab.key ? 'text-primary-500' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </span>
              <span
                className="h-0.5 w-full max-w-14 rounded-full transition-colors"
                style={{ background: tab.key === activeTab.key ? tab.color : 'transparent' }}
              />
              <span className="text-xl font-display font-bold text-text leading-none">{tab.value}</span>
            </button>
          ))}
        </div>

        <ActivityTrendChart
          dates={dates}
          series={[{ key: activeTab.key, label: activeTab.label, color: activeTab.color, values: activeTab.data, unit: activeTab.label.toLowerCase() }]}
        />
      </div>
    </div>
  );
};
