import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  showTime?: boolean;
  placeholder?: string;
  className?: string;
}

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isSameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDate = (d: Date) => `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;


const buildMonthGrid = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; 
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  );
};

export const DateRangePicker = ({
  value,
  onChange,
  showTime = false,
  placeholder = 'Select date range',
  className = '',
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfDay(value.from ?? new Date()));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const previewTo = value.from && !value.to ? hoverDate : value.to;

  const isInRange = (d: Date) => {
    if (!value.from || !previewTo) return false;
    const [lo, hi] = value.from <= previewTo ? [value.from, previewTo] : [previewTo, value.from];
    return d >= startOfDay(lo) && d <= startOfDay(hi);
  };

  const handleDayClick = (day: Date) => {

    const withTime = (base: Date | null, d: Date) =>
      base && showTime ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), base.getHours(), base.getMinutes()) : d;

    if (!value.from || (value.from && value.to)) {
      onChange({ from: withTime(value.from, day), to: null });
      return;
    }
    
    if (day < value.from) {
      onChange({ from: withTime(value.from, day), to: value.from });
    } else {
      onChange({ from: value.from, to: withTime(value.to, day) });
    }
  };

  const setTime = (which: 'from' | 'to', hhmm: string) => {
    const base = value[which];
    if (!base) return;
    const [h, m] = hhmm.split(':').map(Number);
    onChange({ ...value, [which]: new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m) });
  };

  const label = value.from
    ? [
      formatDate(value.from) + (showTime ? ` ${formatTime(value.from)}` : ''),
      value.to ? `${formatDate(value.to)}${showTime ? ` ${formatTime(value.to)}` : ''}` : null,
    ].filter(Boolean).join(' – ')
    : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-display rounded-lg border border-border/60 bg-surface text-text hover:border-border-hover transition-colors cursor-pointer"
      >
        <CalendarIcon size={14} className="text-text-muted shrink-0" />
        <span className={value.from ? 'text-text truncate' : 'text-text-muted truncate'}>{label}</span>
        {value.from && (
          <X
            size={13}
            className="ml-auto text-text-muted hover:text-danger shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange({ from: null, to: null }); }}
          />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-xl border border-border bg-surface shadow-lg p-3 animate-scale-in origin-top-left">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-display font-semibold text-text">
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map(w => (
              <span key={w} className="text-[10px] font-display font-semibold text-text-light text-center uppercase">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {grid.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const isFrom = isSameDay(day, value.from);
              const isTo = isSameDay(day, value.to);
              const inRange = isInRange(day) && !isFrom && !isTo;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  disabled={!inMonth}
                  className={[
                    'size-8 text-[11px] font-display rounded-lg transition-colors',
                    !inMonth ? 'text-text-light/40 cursor-default' : 'text-text cursor-pointer',
                    (isFrom || isTo) ? 'bg-primary-500 text-white font-semibold hover:bg-primary-600' : '',
                    inRange ? 'bg-primary-500/15 text-primary-600 dark:text-primary-300' : '',
                    inMonth && !isFrom && !isTo && !inRange ? 'hover:bg-surface-hover' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {showTime && value.from && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] font-display font-semibold text-text-light uppercase">Start Time</span>
                <input
                  type="time"
                  value={formatTime(value.from)}
                  onChange={(e) => setTime('from', e.target.value)}
                  className="px-2 py-1 text-xs font-display rounded-md border border-border/60 bg-surface text-text"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] font-display font-semibold text-text-light uppercase">End Time</span>
                <input
                  type="time"
                  value={value.to ? formatTime(value.to) : ''}
                  disabled={!value.to}
                  onChange={(e) => setTime('to', e.target.value)}
                  className="px-2 py-1 text-xs font-display rounded-md border border-border/60 bg-surface text-text disabled:opacity-40"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end mt-3 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!value.from || !value.to}
              className="px-3 py-1.5 text-xs font-display font-semibold rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
