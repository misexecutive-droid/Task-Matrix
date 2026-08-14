import { TicketCheck, Timer, AlertTriangle } from 'lucide-react';
import { KpiSectionShell } from './KpiSectionShell';
import { ReportTrendChart } from './ReportTrendChart';
import { useTicketTatReportQuery } from './useAnalyticsQueries';
import { latestWithTrend } from './analyticsDisplay';
import type { GroupBy } from './GroupByControl';

interface TicketKpiSectionProps {
  groupBy: GroupBy;
  from?: string;
  to?: string;
}

export const TicketKpiSection = ({ groupBy, from, to }: TicketKpiSectionProps) => {
  const { data: rows, isPending, isError } = useTicketTatReportQuery(groupBy, from, to);
  const closeRate = latestWithTrend(rows, 'completionRate', 'rate');
  const avgTat = latestWithTrend(rows, 'avgTatHours', 'count');
  const overdue = latestWithTrend(rows, 'overdueCount', 'count');

  return (
    <KpiSectionShell
      icon={TicketCheck}
      title="Complaints (Tickets)"
      description="Close rate is closed-this-period ÷ raised-this-period — a throughput ratio, not a per-ticket cohort rate, since a ticket can be raised in one period and closed in another."
      isPending={isPending}
      isError={isError}
      errorMessage="Failed to load ticket data."
      from={from}
      to={to}
      cards={[
        {
          icon: TicketCheck,
          iconTint: 'text-primary-600 dark:text-primary-400',
          label: 'Close rate',
          value: closeRate.value != null ? `${closeRate.value}%` : '—',
          trend: closeRate.trend,
        },
        {
          icon: Timer,
          iconTint: 'text-indigo-600 dark:text-indigo-400',
          label: 'Avg TAT',
          value: avgTat.value != null ? `${avgTat.value}h` : '—',
          trend: avgTat.trend,
        },
        {
          icon: AlertTriangle,
          iconTint: 'text-amber-600 dark:text-amber-400',
          label: 'Overdue',
          value: overdue.value != null ? `${overdue.value}` : '—',
          trend: overdue.trend,
        },
      ]}
      chart={
        <ReportTrendChart
          data={rows ?? []}
          series={[{ key: 'completionRate', label: 'Close rate %', color: 'var(--color-primary-500)' }]}
          valueSuffix="%"
          yDomain={[0, 100]}
        />
      }
    />
  );
};
