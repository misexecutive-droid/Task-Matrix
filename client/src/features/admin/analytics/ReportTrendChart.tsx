import { Activity } from 'lucide-react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number; name: string; color: string }[];
  valueSuffix?: string;
}

const ChartTooltip = ({ active, payload, label, valueSuffix = '' }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="flex flex-col gap-2 min-w-[160px] p-4 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-xl">
      <p className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-sm font-display text-text-secondary">{p.name}</span>
          </div>
          <span className="text-sm font-display font-bold text-text tabular-nums">
            {p.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};

interface ReportTrendChartProps {
  data: Record<string, unknown>[];
  series: TrendSeries[];
  valueSuffix?: string;
  yDomain?: [number, number];
}

export const ReportTrendChart = ({ data, series, valueSuffix = '', yDomain }: ReportTrendChartProps) => {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] gap-3 rounded-xl border-2 border-dashed border-border">
        <div className="size-12 rounded-full bg-surface-hover flex items-center justify-center text-text-light">
          <Activity className="w-6 h-6" />
        </div>
        <p className="text-sm font-display font-semibold text-text">No data for this period</p>
        <p className="text-xs font-display text-text-muted -mt-2">Adjust the date range or grouping to see a trend.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} width={40} domain={yDomain} />
        <Tooltip
          content={<ChartTooltip valueSuffix={valueSuffix} />}
          cursor={{ stroke: 'var(--color-text-light)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: s.color, stroke: 'var(--color-surface)', strokeWidth: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
