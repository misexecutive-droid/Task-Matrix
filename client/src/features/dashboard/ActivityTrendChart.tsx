import { useId, useRef, useState } from 'react';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  unit?: string;
}

interface ActivityTrendChartProps {
  dates: Date[];
  series: TrendSeries[];
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD = { top: 10, right: 12, bottom: 22, left: 10 };
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

// Generic 1-or-more-series area/line chart — the caller decides what a "series" means
// (a single metric's daily trend, or several plotted together) and supplies the color/label.
export const ActivityTrendChart = ({ dates, series }: ActivityTrendChartProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = useId();

  const n = dates.length;
  const maxVal = Math.max(1, ...series.flatMap(s => s.values)) * 1.15;

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

  const hoveredDate = hoverIndex !== null ? dates[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      {series.length > 1 && (
        <div className="flex items-center gap-4 text-xs font-display text-text-secondary">
          {series.map(s => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`${gradId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
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

          {series.map(s => (
            <path key={s.key} d={smoothAreaPath(pointsFor(s.values, maxVal))} fill={`url(#${gradId}-${s.key})`} />
          ))}
          {series.map(s => (
            <path
              key={s.key}
              d={smoothLinePath(pointsFor(s.values, maxVal))}
              stroke={s.color}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {series.map(s => (
            <circle
              key={s.key}
              cx={xAt(n - 1)}
              cy={yAt(s.values[n - 1] ?? 0)}
              r={4}
              fill={s.color}
              className="stroke-surface"
              strokeWidth={2}
            />
          ))}

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
              {series.map(s => (
                <circle
                  key={s.key}
                  cx={xAt(hoverIndex)}
                  cy={yAt(s.values[hoverIndex] ?? 0)}
                  r={4}
                  fill={s.color}
                  className="stroke-surface"
                  strokeWidth={2}
                />
              ))}
            </>
          )}

          <text x={PAD.left} y={HEIGHT - 4} className="fill-text-light text-[9px] font-display">
            {dates[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </text>
          <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-text-light text-[9px] font-display">
            Today
          </text>
        </svg>

        {hoveredDate && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${(xAt(hoverIndex) / WIDTH) * 100}%` }}
          >
            <p className="font-display font-medium text-text-secondary mb-1 whitespace-nowrap">
              {hoveredDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            {series.map(s => (
              <p key={s.key} className="flex items-center gap-1.5 font-mono tabular-nums text-text whitespace-nowrap">
                <span className="inline-block h-0.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.values[hoverIndex]} {s.unit ?? s.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
