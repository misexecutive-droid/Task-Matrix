import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MonthlyDatum {
  month: string;
  value: number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-surface/85 backdrop-blur-md px-4 py-3 shadow-lg flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
      <p className="text-xs font-display font-medium text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-base font-display font-bold text-text">{payload[0].value.toLocaleString()} items</p>
    </div>
  );
};

interface TaskTrendChartProps {
  data: MonthlyDatum[];
}

// Single series (combined tickets + tasks per month) — a single series never needs
// a legend box; the card header already names what's plotted.
export const TaskTrendChart = ({ data }: TaskTrendChartProps) => (
  <div className="w-full max-w-lg mx-auto h-[200px]">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="taskTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" strokeOpacity={0.6} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
          dy={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          width={60}
          tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
        />
        <Tooltip cursor={{ stroke: 'var(--color-primary-500)', strokeOpacity: 0.3 }} content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-primary-500)"
          strokeWidth={2.5}
          fill="url(#taskTrendFill)"
          dot={{ r: 4, fill: 'var(--color-primary-500)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
          activeDot={{ r: 5.5, fill: 'var(--color-primary-500)', stroke: 'var(--color-surface)', strokeWidth: 2.5 }}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
