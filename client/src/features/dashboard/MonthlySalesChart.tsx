import { MoreHorizontal } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MonthlyDatum {
  month: string;
  value: number;
}

interface MonthlySalesChartProps {
  data: MonthlyDatum[];
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-sm">
      <p className="text-xs font-display text-text-muted">{label}</p>
      <p className="text-sm font-display font-semibold text-text">{payload[0].value}</p>
    </div>
  );
};

export const MonthlySalesChart = ({ data }: MonthlySalesChartProps) => (
  <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-6">
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-base font-display font-semibold text-text">Monthly Activity</h3>
      <button type="button" aria-label="More options" className="text-text-muted hover:text-text-secondary transition-colors">
        <MoreHorizontal size={18} />
      </button>
    </div>

    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} width={32} />
        <Tooltip cursor={{ fill: 'var(--color-surface-hover)' }} content={<ChartTooltip />} />
        <Bar dataKey="value" fill="var(--color-primary-500)" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
