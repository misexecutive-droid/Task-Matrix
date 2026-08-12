import { CalendarRange } from 'lucide-react';
import { PRIORITY_MAP } from './taskDisplay';
import type { Task } from '../../api/task';

interface TaskTimelineProps {
  tasks:         Task[];
  assigneeNames: Map<string, string>;
  onOpen:        (task: Task) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_WIDTH = 48;
const LABEL_WIDTH = 220;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

// Task has no explicit start date — a bar's start is approximated from createdAt through to
// dueDate, since those are the only two dates the model actually tracks. Tasks with no due
// date at all have nothing to plot and are excluded, same as they'd have no due-date column
// in the Table view.
export const TaskTimeline = ({ tasks, assigneeNames, onOpen }: TaskTimelineProps) => {
  const plottable = tasks.filter((t): t is Task & { dueDate: string } => !!t.dueDate);

  if (plottable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-hover/40 rounded border-2 border-dashed border-border">
        <div className="flex items-center justify-center w-12 h-12 bg-surface rounded border border-border mb-4">
          <CalendarRange size={24} className="text-text-light" />
        </div>
        <h3 className="text-lg font-semibold text-text tracking-tight">Nothing to plot</h3>
        <p className="text-sm text-text-muted mt-1 max-w-sm">
          None of the tasks in this view have a due date, so there's nothing to place on the timeline.
        </p>
      </div>
    );
  }

  const starts = plottable.map(t => startOfDay(new Date(t.createdAt)));
  const ends = plottable.map(t => startOfDay(new Date(t.dueDate)));
  const rangeStart = new Date(Math.min(...starts.map(d => d.getTime())));
  const rangeEndRaw = new Date(Math.max(...ends.map(d => d.getTime())));
  const rangeEnd = new Date(rangeEndRaw.getTime() + DAY_MS); // a day of breathing room on the right
  const totalDays = daysBetween(rangeStart, rangeEnd) + 1;
  const days = Array.from({ length: totalDays }, (_, i) => new Date(rangeStart.getTime() + i * DAY_MS));
  const today = new Date();

  return (
    <div className="rounded border border-border overflow-hidden bg-surface">
      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_WIDTH + totalDays * DAY_WIDTH }}>
          {/* Date scale header */}
          <div className="flex border-b border-border">
            <div className="sticky left-0 z-20 shrink-0 bg-surface border-r border-border" style={{ width: LABEL_WIDTH }} />
            {days.map((d, i) => (
              <div
                key={i}
                style={{ width: DAY_WIDTH }}
                className={`shrink-0 text-center text-[11px] font-medium py-2 border-r border-border/40 ${
                  isSameDay(d, today) ? 'text-blue-600 bg-blue-50/60' : 'text-text-muted'
                }`}
              >
                {i === 0 || d.getDate() === 1
                  ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                  : d.getDate()}
              </div>
            ))}
          </div>

          {/* Task rows */}
          {plottable.map(task => {
            const priority = PRIORITY_MAP[task.priority];
            const startIdx = Math.max(0, daysBetween(rangeStart, startOfDay(new Date(task.createdAt))));
            const endIdx = Math.max(startIdx, daysBetween(rangeStart, startOfDay(new Date(task.dueDate))));
            const barLeft = startIdx * DAY_WIDTH;
            const barWidth = (endIdx - startIdx + 1) * DAY_WIDTH;
            const assigneeName = task.assigneeId ? assigneeNames.get(task.assigneeId) : undefined;

            return (
              <div
                key={task.id}
                onClick={() => onOpen(task)}
                className="flex border-b border-border/60 hover:bg-surface-hover/40 transition-colors cursor-pointer"
              >
                <div
                  className="sticky left-0 z-10 shrink-0 bg-surface border-r border-border px-3 py-2.5 min-w-0"
                  style={{ width: LABEL_WIDTH }}
                >
                  <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-text-light' : 'text-text'}`}>
                    {task.title}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{assigneeName ?? 'Unassigned'}</p>
                </div>

                <div className="relative shrink-0" style={{ width: totalDays * DAY_WIDTH, height: 52 }}>
                  <div className="absolute inset-0 flex">
                    {days.map((d, i) => (
                      <div
                        key={i}
                        style={{ width: DAY_WIDTH }}
                        className={`h-full shrink-0 border-r border-border/30 ${isSameDay(d, today) ? 'bg-blue-50/40' : ''}`}
                      />
                    ))}
                  </div>
                  <div
                    title={`${task.title} — due ${new Date(task.dueDate).toLocaleDateString()}`}
                    className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md shadow-xs ${priority.accent} ${task.status === 'done' ? 'opacity-50' : ''}`}
                    style={{ left: barLeft + 4, width: Math.max(barWidth - 8, 16) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
