import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { useSetChecklistInstanceItemDoneMutation } from '../hook';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';
import { formatDate } from '../checklistDisplay';

interface ChecklistInstanceItemDateTimeCardProps {
  item:       ChecklistInstanceItem;
  instanceId: string;
  canWork:    boolean;
  isLocked:   boolean;
}

// <input type="datetime-local"> takes/returns a timezone-less "YYYY-MM-DDTHH:mm" string, not an
// ISO instant — this converts item.dateValue (an ISO instant from the server) to that local-input
// shape for display. toISOString() would shift the clock to UTC, showing the wrong local time.
const toLocalInputValue = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ChecklistInstanceItemDateTimeCard = ({ item, instanceId, canWork, isLocked }: ChecklistInstanceItemDateTimeCardProps) => {
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);
  const [draft, setDraft] = useState(toLocalInputValue(item.dateValue));
  const interactive = canWork && !isLocked;
  const canSubmit = interactive && draft !== '';

  return (
    <div className={`flex flex-col gap-3 p-3 rounded-lg border border-border bg-surface ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold leading-snug text-text">{item.label}</p>
          {item.isDone && item.completedAt && (
            <p className="text-xs text-text-muted font-mono mt-0.5">Completed {formatDate(item.completedAt)}</p>
          )}
        </div>
        {interactive && item.isDone && (
          <button
            onClick={() => setItemDone.mutate({ itemId: item.id, isDone: false, dateValue: new Date(draft).toISOString() })}
            disabled={setItemDone.isPending}
            className="shrink-0 text-text-light hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Reopen item"
            title="Reopen"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {interactive && (
        <div className="flex flex-col gap-2">
          {setItemDone.isError && (
            <p className="text-xs text-danger">
              {setItemDone.error instanceof Error ? setItemDone.error.message : 'Could not save this answer.'}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={item.isDone}
              className="px-2.5 py-1.5 text-sm font-mono bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-60"
            />
            {!item.isDone && (
              <button
                onClick={() => canSubmit && setItemDone.mutate({ itemId: item.id, isDone: true, dateValue: new Date(draft).toISOString() })}
                disabled={!canSubmit || setItemDone.isPending}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setItemDone.isPending && <Loader2 size={12} className="animate-spin" />}
                Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
