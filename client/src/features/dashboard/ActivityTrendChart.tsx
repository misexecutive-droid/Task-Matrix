import { useId, useMemo, useRef, useState } from 'react';

export interface TrendSeries {
  key: string;
  label: string;
  color?: string;
  values: number[];
  unit?: string;
}

interface ActivityTrendChartProps {
  dates: Date[];
  series: TrendSeries[];
  title?: string;
}

const WIDTH = 700;
const HEIGHT = 260;
const PAD = { top: 20, right: 20, bottom: 35, left: 55 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

// Linear path for high-density line charts matching the reference UI
const linearLinePath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  return points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
    ''
  );
};

const linearAreaPath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  const line = linearLinePath(points);
  const lastX = points[points.length - 1].x;
  const firstX = points[0].x;
  const baseY = PAD.top + PLOT_H;
  return `${line} L${lastX.toFixed(1)},${baseY.toFixed(1)} L${firstX.toFixed(1)},${baseY.toFixed(1)} Z`;
};

export const ActivityTrendChart = ({
  dates,
  series,
  title = 'Line Chart 3',
}: ActivityTrendChartProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = useId();

  const n = dates.length;

  // Compute scale boundaries & ticks
  const { minVal, maxVal, yTicks, xTicks } = useMemo(() => {
    if (n === 0 || series.length === 0) {
      return { minVal: 0, maxVal: 1, yTicks: [], xTicks: [] };
    }

    const allValues = series.flatMap(s => s.values);
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);

    const padding = (rawMax - rawMin) * 0.15 || 5;
    const min = Math.floor(Math.max(0, rawMin - padding));
    const max = Math.ceil(rawMax + padding);

    // Generate 5 evenly spaced Y-axis ticks
    const tickCount = 5;
    const yStep = (max - min) / (tickCount - 1);
    const yTicksArr = Array.from({ length: tickCount }, (_, i) => min + i * yStep);

    // Generate month-based X-axis ticks (sampling evenly across dates array)
    const maxXTicks = 8;
    const step = Math.max(1, Math.floor(n / maxXTicks));
    const xTicksArr = [];
    for (let i = 0; i < n; i += step) {
      xTicksArr.push(i);
    }
    if (xTicksArr[xTicksArr.length - 1] !== n - 1) {
      xTicksArr.push(n - 1);
    }

    return { minVal: min, maxVal: max, yTicks: yTicksArr, xTicks: xTicksArr };
  }, [series, n]);

  if (n === 0 || series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
        <div className="flex items-center justify-center mb-3 text-slate-400">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No trend data available</p>
        <p className="text-xs text-slate-500 mt-1">Metrics will appear here over time.</p>
      </div>
    );
  }

  const xAt = (i: number) => PAD.left + (i / Math.max(1, n - 1)) * PLOT_W;
  const yAt = (v: number) => PAD.top + PLOT_H - ((v - minVal) / Math.max(1, maxVal - minVal)) * PLOT_H;

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const x = fraction * WIDTH;
    const index = Math.round(((x - PAD.left) / PLOT_W) * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, index)));
  };

  const hoveredDate = hoverIndex !== null ? dates[hoverIndex] : null;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
      
      {/* Title Header */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
        {title}
      </h3>

      {/* SVG Chart Container */}
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none overflow-visible cursor-crosshair select-none"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map(s => {
              const color = s.color || '#4f46e5';
              return (
                <linearGradient key={s.key} id={`${gradId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid Lines & Y-Axis Scale Numbers */}
          {yTicks.map(v => {
            const y = yAt(v);
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-medium tabular-nums"
                >
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Series Areas & Lines */}
          {series.map(s => {
            const points = s.values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
            const color = s.color || '#4f46e5';

            return (
              <g key={s.key}>
                {/* Area Fill */}
                <path
                  d={linearAreaPath(points)}
                  fill={`url(#${gradId}-${s.key})`}
                />
                {/* Stroke Line */}
                <path
                  d={linearLinePath(points)}
                  stroke={color}
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* X-Axis Month Labels */}
          {xTicks.map(i => {
            const d = dates[i];
            if (!d) return null;

            const isYearHeader = d.getMonth() === 0; // January -> bold year label (e.g. "2026")
            const label = isYearHeader
              ? d.getFullYear().toString()
              : d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }).replace(' ', " '");

            return (
              <text
                key={i}
                x={xAt(i)}
                y={HEIGHT - 6}
                textAnchor="middle"
                className={`text-[11px] ${
                  isYearHeader
                    ? 'fill-slate-900 dark:fill-white font-bold'
                    : 'fill-slate-500 dark:fill-slate-400 font-medium'
                }`}
              >
                {label}
              </text>
            );
          })}

          {/* Interactive Hover Indicator */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {series.map(s => (
                <circle
                  key={s.key}
                  cx={xAt(hoverIndex)}
                  cy={yAt(s.values[hoverIndex] ?? 0)}
                  r={4}
                  fill={s.color || '#4f46e5'}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredDate && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute -top-3 -translate-x-1/2 rounded-lg border border-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 shadow-lg ring-1 ring-black/5 z-10 whitespace-nowrap"
            style={{ left: `${(xAt(hoverIndex) / WIDTH) * 100}%` }}
          >
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {hoveredDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {series.map(s => (
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || '#4f46e5' }}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                  {(s.values[hoverIndex] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};