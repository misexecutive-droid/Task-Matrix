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
const PAD = { top: 15, right: 12, bottom: 24, left: 10 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const pointsFor = (values: number[], maxVal: number) =>
  values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1)) * PLOT_W,
    y: PAD.top + PLOT_H - (v / maxVal) * PLOT_H,
  }));

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
    <div className="flex flex-col gap-5 w-full">
      {/* Legend */}
      {series.length > 1 && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {series.map(s => (
            <span 
              key={s.key} 
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-surface-hover/50 border border-border/40 text-xs font-display font-medium text-text-muted shadow-sm transition-colors hover:bg-surface-hover"
            >
              <span 
                className="inline-block h-2 w-2 rounded-full shadow-sm" 
                style={{ background: s.color }} 
              />
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Chart Area */}
      <div className="relative group">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none overflow-visible"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`${gradId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid Lines */}
          {[0, 0.5, 1].map(f => (
            <line
              key={f}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={PAD.top + PLOT_H * f}
              y2={PAD.top + PLOT_H * f}
              className="stroke-border opacity-50"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Areas */}
          {series.map(s => (
            <path 
              key={`area-${s.key}`} 
              d={smoothAreaPath(pointsFor(s.values, maxVal))} 
              fill={`url(#${gradId}-${s.key})`} 
              className="transition-opacity duration-300"
            />
          ))}
          
          {/* Lines */}
          {series.map(s => (
            <path
              key={`line-${s.key}`}
              d={smoothLinePath(pointsFor(s.values, maxVal))}
              stroke={s.color}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          ))}

          {/* End Markers (Today) */}
          {series.map(s => (
            <circle
              key={`end-${s.key}`}
              cx={xAt(n - 1)}
              cy={yAt(s.values[n - 1] ?? 0)}
              r={4.5}
              fill={s.color}
              className="stroke-surface"
              strokeWidth={2.5}
            />
          ))}

          {/* Hover State Indicator */}
          {hoverIndex !== null && (
            <>
              {/* Vertical Guide Line */}
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                className="stroke-text-muted/40"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* Hover Dots */}
              {series.map(s => (
                <circle
                  key={`hover-${s.key}`}
                  cx={xAt(hoverIndex)}
                  cy={yAt(s.values[hoverIndex] ?? 0)}
                  r={5}
                  fill={s.color}
                  className="stroke-surface drop-shadow-md"
                  strokeWidth={2.5}
                />
              ))}
            </>
          )}

          {/* Axis Labels */}
          <text 
            x={PAD.left} 
            y={HEIGHT - 4} 
            className="fill-text-muted text-[10px] font-display font-semibold uppercase tracking-wider"
          >
            {dates[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </text>
          <text 
            x={WIDTH - PAD.right} 
            y={HEIGHT - 4} 
            textAnchor="end" 
            className="fill-text-muted text-[10px] font-display font-semibold uppercase tracking-wider"
          >
            Today
          </text>
        </svg>

        {/* Floating Glass Tooltip */}
        {hoveredDate && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute -top-2 -translate-x-1/2 rounded-xl border border-border/50 bg-surface/85 backdrop-blur-md px-4 py-3 shadow-lg z-10 min-w-[120px] transition-[left] duration-75 ease-out animate-in fade-in zoom-in-95"
            style={{ left: `${(xAt(hoverIndex) / WIDTH) * 100}%` }}
          >
            <p className="text-[11px] font-display font-semibold text-text-muted uppercase tracking-wider mb-2 whitespace-nowrap border-b border-border/40 pb-1.5">
              {hoveredDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <div className="flex flex-col gap-1.5">
              {series.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-4 font-display whitespace-nowrap">
                  <span className="flex items-center gap-2 text-sm text-text-muted">
                    <span 
                      className="inline-block h-2 w-2 rounded-full shadow-sm" 
                      style={{ background: s.color }} 
                    />
                    {s.label}
                  </span>
                  <span className="text-sm font-bold text-text">
                    {s.values[hoverIndex].toLocaleString()} <span className="text-xs font-medium text-text-muted ml-0.5">{s.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};