import { useId, useRef, useState } from 'react';

interface TrendPoint {
  date:    Date;
  tickets: number;
  tasks:   number;
}

interface ActivityTrendChartProps {
  title: string;
  data:  TrendPoint[];
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD = { top: 10, right: 28, bottom: 22, left: 10 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const pointsFor = (values: number[], maxVal: number) =>
  values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1)) * PLOT_W,
    y: PAD.top + PLOT_H - (v / maxVal) * PLOT_H,
  }));

// Catmull-Rom -> cubic Bezier (tension 1/6) so the line reads as a smooth curve
// through every data point, rather than sharp straight-line segments.
const smoothLinePath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
};

const smoothAreaPath = (points: { x: number; y: number }[]) => {
  const line = smoothLinePath(points);
  const lastX = PAD.left + PLOT_W;
  const baseY = PAD.top + PLOT_H;
  return `${line} L${lastX.toFixed(1)},${baseY.toFixed(1)} L${PAD.left},${baseY.toFixed(1)} Z`;
};

export const ActivityTrendChart = ({ title, data }: ActivityTrendChartProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = useId();

  const n = data.length;
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.tickets, d.tasks))) * 1.15;

  const xAt = (i: number) => PAD.left + (i / (n - 1)) * PLOT_W;
  const yAt = (v: number) => PAD.top + PLOT_H - (v / maxVal) * PLOT_H;

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const x = fraction * WIDTH;
    const index = Math.round(((x - PAD.left) / PLOT_W) * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, index)));
  };

  const lastTicket = data[n - 1]?.tickets ?? 0;
  const lastTask = data[n - 1]?.tasks ?? 0;
  const labelsClose = Math.abs(yAt(lastTicket) - yAt(lastTask)) < 12;
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  const half = Math.floor(n / 2) || 1;
  const prevTotal = data.slice(0, half).reduce((s, d) => s + d.tickets + d.tasks, 0);
  const currTotal = data.slice(half).reduce((s, d) => s + d.tickets + d.tasks, 0);
  const deltaPct = prevTotal === 0 ? null : Math.round(((currTotal - prevTotal) / prevTotal) * 100);
  const rangeLabel = n > 0
    ? `${data[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${data[n - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : '';

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-display font-semibold text-text">{title}</h2>
          <p className="text-xs text-text-muted mt-0.5">{rangeLabel}</p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xl font-display font-bold text-text">{currTotal}</span>
            {deltaPct !== null ? (
              <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full ${
                deltaPct >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-danger/10 text-danger'
              }`}>
                {deltaPct >= 0 ? '+' : ''}{deltaPct}%
              </span>
            ) : currTotal > 0 ? (
              <span className="text-xs font-display font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-300">
                New
              </span>
            ) : null}
          </div>
          <p className="text-xs text-text-muted mt-0.5">Items this week</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-display text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-primary-500" />
          Tickets
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-amber-500" />
          Tasks
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`${gradId}-tickets`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradId}-tasks`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map(f => (
            <line
              key={f}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={PAD.top + PLOT_H * f}
              y2={PAD.top + PLOT_H * f}
              className="stroke-border"
              strokeWidth={1}
            />
          ))}

          <path d={smoothAreaPath(pointsFor(data.map(d => d.tickets), maxVal))} fill={`url(#${gradId}-tickets)`} />
          <path d={smoothAreaPath(pointsFor(data.map(d => d.tasks), maxVal))} fill={`url(#${gradId}-tasks)`} />
          <path
            d={smoothLinePath(pointsFor(data.map(d => d.tickets), maxVal))}
            className="stroke-primary-500"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={smoothLinePath(pointsFor(data.map(d => d.tasks), maxVal))}
            className="stroke-amber-500"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle cx={xAt(n - 1)} cy={yAt(lastTicket)} r={4} className="fill-primary-500 stroke-surface" strokeWidth={2} />
          <circle cx={xAt(n - 1)} cy={yAt(lastTask)} r={4} className="fill-amber-500 stroke-surface" strokeWidth={2} />

          <text x={xAt(n - 1) + 7} y={yAt(lastTicket) + (labelsClose ? -4 : 3)} className="fill-text-secondary text-[9px] font-mono">
            {lastTicket}
          </text>
          <text x={xAt(n - 1) + 7} y={yAt(lastTask) + (labelsClose ? 8 : 3)} className="fill-text-secondary text-[9px] font-mono">
            {lastTask}
          </text>

          {hoverIndex !== null && (
            <>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                className="stroke-text-light"
                strokeWidth={1}
              />
              <circle cx={xAt(hoverIndex)} cy={yAt(data[hoverIndex].tickets)} r={4} className="fill-primary-500 stroke-surface" strokeWidth={2} />
              <circle cx={xAt(hoverIndex)} cy={yAt(data[hoverIndex].tasks)} r={4} className="fill-amber-500 stroke-surface" strokeWidth={2} />
            </>
          )}

          <text x={PAD.left} y={HEIGHT - 4} className="fill-text-light text-[9px] font-display">
            {data[0]?.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </text>
          <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-text-light text-[9px] font-display">
            Today
          </text>
        </svg>

        {hovered && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${(xAt(hoverIndex) / WIDTH) * 100}%` }}
          >
            <p className="font-display font-medium text-text-secondary mb-1 whitespace-nowrap">
              {hovered.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="flex items-center gap-1.5 font-mono tabular-nums text-text whitespace-nowrap">
              <span className="inline-block h-0.5 w-2.5 rounded-full bg-primary-500" />
              {hovered.tickets} ticket{hovered.tickets === 1 ? '' : 's'}
            </p>
            <p className="flex items-center gap-1.5 font-mono tabular-nums text-text whitespace-nowrap">
              <span className="inline-block h-0.5 w-2.5 rounded-full bg-amber-500" />
              {hovered.tasks} task{hovered.tasks === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
