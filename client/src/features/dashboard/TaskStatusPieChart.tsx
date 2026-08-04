import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { STATUS_LABEL } from '../tasks/taskDisplay';
import type { Task } from '../../api/task';

const STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'pending_verification', 'done'];

const STATUS_FILL: Record<Task['status'], string> = {
  todo: 'var(--color-status-todo)',
  in_progress: 'var(--color-status-progress)',
  pending_verification: 'var(--color-status-verify)',
  done: 'var(--color-status-done)',
};

interface SliceTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}

const SliceTooltip = ({ active, payload }: SliceTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border border-border/50 bg-surface/85 backdrop-blur-md px-4 py-2.5 shadow-lg">
      <p className="text-xs font-display font-semibold text-text">{name}</p>
      <p className="text-sm font-display font-bold text-text-muted">{value} task{value !== 1 ? 's' : ''}</p>
    </div>
  );
};

interface SliceLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const renderSliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: SliceLabelProps) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-white text-[11px] font-display font-bold">
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

interface TaskStatusPieChartProps {
  tasks: Task[];
}

export const TaskStatusPieChart = ({ tasks }: TaskStatusPieChartProps) => {
  const data = STATUS_ORDER.map(status => ({
    key: status,
    name: STATUS_LABEL[status],
    value: tasks.filter(t => t.status === status).length,
  })).filter(d => d.value > 0);

  const total = tasks.length;

  if (total === 0) {
    return <p className="flex items-center justify-center h-[220px] text-sm text-text-muted">No tasks yet.</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-full sm:w-[220px] h-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 3 : 0}
              cornerRadius={4}
              stroke="none"
              label={renderSliceLabel}
              labelLine={false}
              animationDuration={700}
            >
              {data.map(d => <Cell key={d.key} fill={STATUS_FILL[d.key]} />)}
            </Pie>
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-display font-bold text-text">{total}</span>
          <span className="text-[11px] font-display text-text-muted">Total tasks</span>
        </div>
      </div>

      {/* Legend — always present for 4 series; carries the exact count per status. */}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        {STATUS_ORDER.map(status => {
          const count = tasks.filter(t => t.status === status).length;
          return (
            <div key={status} className="flex items-center gap-2.5 text-sm font-display">
              <span className="size-2.5 rounded-full shrink-0" style={{ background: STATUS_FILL[status] }} />
              <span className="text-text-muted flex-1">{STATUS_LABEL[status]}</span>
              <span className="font-bold text-text tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
