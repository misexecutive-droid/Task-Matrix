export interface CategoryBar {
  key: string;
  label: string;
  done: number;
  total: number;
  barClassName: string;
  onClick: () => void;
}

const rateOf = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

// A plain CSS bar chart (no charting library) — same hand-rolled approach as MonthlyTargetCard's
// SVG gauge elsewhere in this app. Each bar is independently clickable so a reviewer can jump
// straight from "Delegation is at 40%" to the filtered list of exactly those items.
export const CategoryBarChart = ({ bars }: { bars: CategoryBar[] }) => (
  <div className="flex items-end justify-between gap-4 sm:gap-6 h-48 px-2">
    {bars.map(bar => {
      const rate = rateOf(bar.done, bar.total);
      return (
        <button
          key={bar.key}
          type="button"
          onClick={bar.onClick}
          disabled={bar.total === 0}
          className="group flex flex-1 flex-col items-center gap-2 h-full cursor-pointer outline-none disabled:cursor-default"
        >
          <span className="text-xs font-display font-semibold text-text tabular-nums">
            {bar.total > 0 ? `${rate}%` : '—'}
          </span>

          <div className="relative flex-1 w-full max-w-14 rounded-lg bg-surface-hover overflow-hidden flex items-end">
            {bar.total > 0 && (
              <div
                className={`w-full rounded-lg transition-all duration-500 ease-out group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-primary-500/40 ${bar.barClassName}`}
                style={{ height: `${Math.max(rate, 4)}%` }}
              />
            )}
          </div>

          <span className="text-[11px] font-display font-semibold text-text-secondary">{bar.label}</span>
          <span className="text-[10px] font-display text-text-muted tabular-nums">{bar.done}/{bar.total}</span>
        </button>
      );
    })}
  </div>
);
