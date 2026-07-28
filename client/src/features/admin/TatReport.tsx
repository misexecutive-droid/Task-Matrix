import { useState } from 'react';
import { Clock3, AlertTriangle, ListChecks, BarChart3, CheckCircle2 } from 'lucide-react';
import { useTatReportQuery } from '../tickets/hook';
import type { TatReportGroupBy } from '../../api/ticket';
import { Skeleton } from '@/components';
import { MetricCell } from '../dashboard/MetricCell';

const GROUP_OPTIONS: { key: TatReportGroupBy; label: string }[] = [
  { key: 'hour', label: 'Hour' },
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const formatBucket = (bucket: string, groupBy: TatReportGroupBy) => {
  if (groupBy === 'hour') return new Date(bucket + ':00').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' });
  if (groupBy === 'week') return bucket.replace('-W', ' · Wk ');
  if (groupBy === 'month') {
    const [y, m] = bucket.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
  return new Date(bucket).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const BarChart = ({ rows, barClassName, unit }: {
  rows: { bucket: string; value: number }[];
  barClassName: string;
  unit: string;
}) => {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="flex items-end gap-1.5 h-40 px-1">
      {rows.map(r => (
        <div key={r.bucket} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group min-w-0">
          <span className="text-[10px] font-display font-medium text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {r.value}{unit}
          </span>
          <div
            className={`w-full rounded-t-sm transition-all group-hover:brightness-110 ${barClassName}`}
            style={{ height: `${Math.max(2, (r.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
};

type ChartTabKey = 'avgTat' | 'closed';

export const TatReport = () => {
  const [groupBy, setGroupBy] = useState<TatReportGroupBy>('day');
  const [chartTab, setChartTab] = useState<ChartTabKey>('avgTat');
  const { data: rows, isPending, isError } = useTatReportQuery(groupBy);

  const totalClosed = (rows ?? []).reduce((s, r) => s + r.count, 0);
  const totalOverdue = (rows ?? []).reduce((s, r) => s + r.overdueCount, 0);
  const onTimeRate = totalClosed > 0 ? Math.round(((totalClosed - totalOverdue) / totalClosed) * 100) : null;
  const avgTat = (() => {
    const withAvg = (rows ?? []).filter(r => r.avgTatHours != null);
    if (!withAvg.length) return null;
    const weighted = withAvg.reduce((s, r) => s + r.avgTatHours! * r.count, 0);
    const count = withAvg.reduce((s, r) => s + r.count, 0);
    return count ? Math.round((weighted / count) * 10) / 10 : null;
  })();

  const chartTabs: { key: ChartTabKey; label: string; value: string; barClassName: string; rows: { bucket: string; value: number }[]; unit: string }[] = [
    {
      key: 'avgTat',
      label: 'Avg TAT (hours)',
      value: avgTat != null ? `${avgTat}h` : '—',
      barClassName: 'bg-primary-500',
      rows: (rows ?? []).map(r => ({ bucket: r.bucket, value: r.avgTatHours ?? 0 })),
      unit: 'h',
    },
    {
      key: 'closed',
      label: 'Tickets closed',
      value: String(totalClosed),
      barClassName: 'bg-emerald-500',
      rows: (rows ?? []).map(r => ({ bucket: r.bucket, value: r.count })),
      unit: '',
    },
  ];
  const activeChart = chartTabs.find(t => t.key === chartTab) ?? chartTabs[0];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold text-text">Ticket TAT report</h1>
          <p className="text-sm text-text-muted mt-0.5">Turnaround time on closed tickets, grouped by period.</p>
        </div>
      </div>

      {isPending && (
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
      )}

      {isError && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          Failed to load the TAT report.
        </div>
      )}

      {!isPending && !isError && (
        <div className="rounded-lg border border-border bg-surface grid grid-cols-1 lg:grid-cols-5">
          {/* Metric grid */}
          <div className="lg:col-span-2 grid grid-cols-2 border-b lg:border-b-0 lg:border-r border-border">
            <MetricCell
              icon={ListChecks}
              iconTint="bg-primary-500/10 text-primary-600 dark:text-primary-300"
              label="Closed tickets"
              value={totalClosed}
              linkTo="/admin/tickets"
              linkPrefix="See all"
              linkLabel="tickets"
              className="border-r border-b border-border"
            />
            <MetricCell
              icon={Clock3}
              iconTint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              label="Avg. turnaround"
              value={avgTat != null ? `${avgTat}h` : '—'}
              className="border-b border-border"
            />
            <MetricCell
              icon={AlertTriangle}
              iconTint="bg-danger/10 text-danger"
              label="Went overdue"
              value={totalOverdue}
              linkTo="/admin/tickets"
              linkPrefix="Review"
              linkLabel="overdue tickets"
              className="border-r border-border"
            />
            <MetricCell
              icon={CheckCircle2}
              iconTint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              label="On-time rate"
              value={onTimeRate != null ? `${onTimeRate}%` : '—'}
            />
          </div>

          {/* Tabbed bar chart */}
          <div className="lg:col-span-3 flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-6">
                {chartTabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setChartTab(tab.key)}
                    className="flex flex-col items-start gap-1.5 cursor-pointer"
                  >
                    <span className={`text-xs font-display font-medium transition-colors ${
                      tab.key === activeChart.key ? 'text-primary-500' : 'text-text-muted hover:text-text-secondary'
                    }`}>
                      {tab.label}
                    </span>
                    <span
                      className={`h-0.5 w-full max-w-14 rounded-full transition-colors ${
                        tab.key === activeChart.key ? tab.barClassName : 'bg-transparent'
                      }`}
                    />
                    <span className="text-xl font-display font-bold text-text leading-none">{tab.value}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-1 p-1 bg-surface-hover rounded-lg w-fit">
                {GROUP_OPTIONS.map(o => (
                  <button
                    key={o.key}
                    onClick={() => setGroupBy(o.key)}
                    className={[
                      'px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer',
                      groupBy === o.key ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text-secondary',
                    ].join(' ')}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {(!rows || rows.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
                <Clock3 size={28} className="text-text-light" />
                <p className="text-sm font-display">No closed tickets in this range yet.</p>
              </div>
            ) : (
              <div>
                <BarChart rows={activeChart.rows} barClassName={activeChart.barClassName} unit={activeChart.unit} />
                <div className="flex gap-1.5 px-1 mt-1">
                  {rows.map(r => (
                    <span key={r.bucket} className="flex-1 text-center text-[10px] text-text-muted font-display truncate">
                      {formatBucket(r.bucket, groupBy)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
