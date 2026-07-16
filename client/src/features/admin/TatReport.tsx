import { useState } from 'react';
import { Clock3, AlertTriangle, ListChecks } from 'lucide-react';
import { useTatReportQuery } from '../tickets/hook';
import type { TatReportGroupBy } from '../../api/ticket';
import { Skeleton } from '@/components';

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
        <div key={r.bucket} className="flex-1 flex flex-col items-center justify-end gap-1 group min-w-0">
          <span className="text-[10px] font-display text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {r.value}{unit}
          </span>
          <div
            className={`w-full rounded-t-sm transition-all ${barClassName}`}
            style={{ height: `${Math.max(2, (r.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
};

export const TatReport = () => {
  const [groupBy, setGroupBy] = useState<TatReportGroupBy>('day');
  const { data: rows, isPending, isError } = useTatReportQuery(groupBy);

  const totalClosed = (rows ?? []).reduce((s, r) => s + r.count, 0);
  const totalOverdue = (rows ?? []).reduce((s, r) => s + r.overdueCount, 0);
  const avgTat = (() => {
    const withAvg = (rows ?? []).filter(r => r.avgTatHours != null);
    if (!withAvg.length) return null;
    const weighted = withAvg.reduce((s, r) => s + r.avgTatHours! * r.count, 0);
    const count = withAvg.reduce((s, r) => s + r.count, 0);
    return count ? Math.round((weighted / count) * 10) / 10 : null;
  })();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-display font-semibold text-slate-900">Ticket TAT report</h1>
        <p className="text-sm text-slate-400 mt-0.5">Turnaround time on closed tickets, grouped by period.</p>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {GROUP_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => setGroupBy(o.key)}
            className={[
              'px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer',
              groupBy === o.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>

      {isPending && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200/70 bg-white'>
                  <Skeleton className='size-[18px] rounded-full' />
                  <div className='flex flex-col gap-1.5'>
                    <Skeleton className='h-5 w-12' />
                    <Skeleton className='h-3 w-20' />

                  </div>

                </div>
              ))
            }

          </div>

          <div className='rounded-lg border border-slate-200/70 bg-white p-4'>
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-40 w-full" />

          </div>
        </>
      )}

      {isError && (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-500 text-sm font-display">
          Failed to load the TAT report.
        </div>
      )}

      {!isPending && !isError && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200/70 bg-white">
              <ListChecks size={18} className="text-primary-500" />
              <div>
                <p className="text-lg font-display font-semibold text-slate-800">{totalClosed}</p>
                <p className="text-xs text-slate-400 font-display">Closed tickets</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200/70 bg-white">
              <Clock3 size={18} className="text-amber-500" />
              <div>
                <p className="text-lg font-display font-semibold text-slate-800">{avgTat ?? '—'}{avgTat != null ? 'h' : ''}</p>
                <p className="text-xs text-slate-400 font-display">Avg. turnaround</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200/70 bg-white">
              <AlertTriangle size={18} className="text-red-500" />
              <div>
                <p className="text-lg font-display font-semibold text-slate-800">{totalOverdue}</p>
                <p className="text-xs text-slate-400 font-display">Went overdue</p>
              </div>
            </div>
          </div>

          {(!rows || rows.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Clock3 size={28} className="text-slate-300" />
              <p className="text-sm font-display">No closed tickets in this range yet.</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200/70 bg-white p-4">
                <h3 className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Average TAT (hours)
                </h3>
                <BarChart rows={rows.map(r => ({ bucket: r.bucket, value: r.avgTatHours ?? 0 }))} barClassName="bg-primary-500" unit="h" />
                <div className="flex gap-1.5 px-1 mt-1">
                  {rows.map(r => (
                    <span key={r.bucket} className="flex-1 text-center text-[10px] text-slate-400 font-display truncate">
                      {formatBucket(r.bucket, groupBy)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/70 bg-white p-4">
                <h3 className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Tickets closed
                </h3>
                <BarChart rows={rows.map(r => ({ bucket: r.bucket, value: r.count }))} barClassName="bg-emerald-500" unit="" />
                <div className="flex gap-1.5 px-1 mt-1">
                  {rows.map(r => (
                    <span key={r.bucket} className="flex-1 text-center text-[10px] text-slate-400 font-display truncate">
                      {formatBucket(r.bucket, groupBy)}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};