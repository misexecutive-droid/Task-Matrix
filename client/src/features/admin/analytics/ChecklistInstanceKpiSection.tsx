import { Repeat, Camera } from 'lucide-react';
import { KpiSectionShell } from './KpiSectionShell';
import { ReportTrendChart } from './ReportTrendChart';
import { useChecklistInstanceComplianceReportQuery } from './useAnalyticsQueries';
import { latestWithTrend } from './analyticsDisplay';
import type { GroupBy } from './GroupByControl';

interface ChecklistInstanceKpiSectionProps {
  groupBy: GroupBy;
  from?: string;
  to?: string;
}

export const ChecklistInstanceKpiSection = ({ groupBy, from, to }: ChecklistInstanceKpiSectionProps) => {
  const { data: rows, isPending, isError } = useChecklistInstanceComplianceReportQuery(groupBy, from, to);
  const completion = latestWithTrend(rows, 'completionRate', 'rate');
  const quality = latestWithTrend(rows, 'qualityRate', 'rate');

  return (
    <KpiSectionShell
      icon={Repeat}
      title="Recurring Checklists"
      description="Completion and photo-quality compliance for scheduled checklist instances, bucketed by each instance's period."
      isPending={isPending}
      isError={isError}
      errorMessage="Failed to load recurring checklist data."
      cards={[
        {
          icon: Repeat,
          iconTint: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
          label: 'Completion rate',
          value: completion.value != null ? `${completion.value}%` : '—',
          trend: completion.trend,
        },
        {
          icon: Camera,
          iconTint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          label: 'Photo quality rate',
          value: quality.value != null ? `${quality.value}%` : '—',
          trend: quality.trend,
        },
      ]}
      chart={
        <ReportTrendChart
          data={rows ?? []}
          series={[
            { key: 'completionRate', label: 'Completion %', color: 'var(--color-primary-500)' },
            { key: 'qualityRate', label: 'Quality %', color: 'var(--color-success)' },
          ]}
          valueSuffix="%"
          yDomain={[0, 100]}
        />
      }
    />
  );
};
