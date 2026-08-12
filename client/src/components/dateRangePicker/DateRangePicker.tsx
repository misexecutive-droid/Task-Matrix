import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '../button';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function DateRangePicker({
  value,
  onChange,
  showTime = false,
  placeholder = 'Select date range',
  className = '',
}: DateRangePickerProps) {
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
      ]
        .filter(Boolean)
        .join(' – ')
    : placeholder;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 w-full h-10 px-3 rounded-md border bg-surface text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-coral-400",
          open ? "border-primary-400" : "border-border hover:border-primary-400"
        )}
      >
        <CalendarIcon size={16} className="text-text-light shrink-0" />
        <span className={cn("truncate", value.from ? 'text-text font-semibold' : 'text-text-muted font-normal')}>
          {label}
        </span>
        {value.from && (
          <X
            size={14}
            className="ml-auto text-text-light hover:text-danger transition-colors shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ from: null, to: null });
            }}
          />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[320px] rounded-lg border border-border bg-surface shadow-lg p-5 animate-in fade-in zoom-in-95 origin-top-left">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-md border border-border text-text-muted hover:bg-surface-hover flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-display font-bold uppercase tracking-wide text-primary-700">
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-md border border-border text-text-muted hover:bg-surface-hover flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days Grid Header */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="text-[10px] font-bold uppercase tracking-wide text-text-light text-center">
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-1">
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
                  className={cn(
                    'h-8 text-xs rounded-md transition-colors font-semibold',
                    !inMonth ? 'text-text-light/40 cursor-default' : 'text-text-secondary cursor-pointer',
                    (isFrom || isTo) && 'bg-primary-700 text-white shadow-sm hover:bg-primary-800',
                    inRange && 'bg-primary-500/15 text-primary-700 dark:text-primary-300',
                    inMonth && !isFrom && !isTo && !inRange && 'hover:bg-surface-hover hover:text-primary-700'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time Selection */}
          {showTime && value.from && (
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/60">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formatTime(value.from)}
                  onChange={(e) => setTime('from', e.target.value)}
                  className="w-full h-10 rounded-md border border-border px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-primary-400"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                  End Time
                </label>
                <input
                  type="time"
                  value={value.to ? formatTime(value.to) : ''}
                  disabled={!value.to}
                  onChange={(e) => setTime('to', e.target.value)}
                  className="w-full h-10 rounded-md border border-border px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-primary-400 disabled:bg-surface-hover disabled:text-text-light disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end mt-5 pt-4 border-t border-border/60">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={!value.from || !value.to}
            >
              Apply Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}