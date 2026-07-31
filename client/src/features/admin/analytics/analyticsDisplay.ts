import { trendFrom, pointDelta, type Trend } from '../../dashboard';

type ReportRow = { bucket: string; [key: string]: unknown };

// trendFrom expects a percent-change between two raw counts (e.g. ticket volume); pointDelta
// expects a plain point difference between two already-percentage values (e.g. two buckets'
// completion rates) — see dashboardDisplay.ts. Looked up by kind so callers don't have to know
// which math applies to which metric.
const TREND_FN: Record<'rate' | 'count', (current: number, previous: number) => Trend> = {
  rate: pointDelta,
  count: trendFrom,
};

// Latest-bucket value + trend vs. the bucket before it, for a StatCard. Falls back gracefully
// when there's no data yet, or only one bucket to show (nothing to compare against).
export const latestWithTrend = (
  rows: ReportRow[] | undefined,
  key: string,
  kind: 'rate' | 'count' = 'count',
): { value: number | null; trend: Trend } => {
  if (!rows || rows.length === 0) return { value: null, trend: { direction: 'up', label: '—' } };

  const latest = rows[rows.length - 1];
  const previous = rows.length > 1 ? rows[rows.length - 2] : undefined;
  const value = (latest[key] as number | null | undefined) ?? null;

  if (value == null) return { value: null, trend: { direction: 'up', label: '—' } };

  const previousValue = previous?.[key] as number | null | undefined;
  if (previousValue == null) return { value, trend: { direction: 'up', label: 'New' } };

  return { value, trend: TREND_FN[kind](value, previousValue) };
};
