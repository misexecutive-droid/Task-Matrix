interface StatusBarDatum {
  label:      string;
  value:      number;
  colorClass: string;
}

interface StatusBarChartProps {
  title: string;
  data:  StatusBarDatum[];
  unit:  string;
}

export const StatusBarChart = ({ title, data, unit }: StatusBarChartProps) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-display font-semibold text-text">{title}</h2>
        <span className="text-xs font-mono tabular-nums text-text-muted">{total} total</span>
      </div>

      {total === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted font-display">Nothing to show yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map(d => {
            const pct = (d.value / max) * 100;
            return (
              <div
                key={d.label}
                tabIndex={0}
                className="group relative flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <span className="w-[4.5rem] shrink-0 text-xs font-display text-text-secondary truncate">{d.label}</span>
                <div className="relative h-2 flex-1 rounded-full bg-surface-hover">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${d.colorClass} group-hover:brightness-110`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-mono tabular-nums text-text">{d.value}</span>

                <div
                  role="tooltip"
                  className="pointer-events-none absolute -top-8 left-[4.5rem] z-10 whitespace-nowrap rounded-md bg-text px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {d.value} {d.value === 1 ? unit : `${unit}s`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
