import { useState } from 'react';
import { Hash, Loader2, RotateCcw } from 'lucide-react';
import { useSetChecklistInstanceItemDoneMutation } from '../hook';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';
import { formatDate } from '../checklistDisplay';

interface ChecklistInstanceItemNumberEntryCardProps {
  item:       ChecklistInstanceItem;
  instanceId: string;
  canWork:    boolean; // assignee or admin — allowed to submit a reading
  isLocked:   boolean; // instance already APPROVED — frozen, no further changes
}

// NUMBER_ENTRY counterpart to ChecklistInstanceItemCard — a reading instead of a checkbox/photo.
// The server (checklistInstance.service.ts's assertNumberEntrySatisfied) is the source of truth
// for the min/max check; this only mirrors it locally so the button can be disabled before a
// round trip, not to replace the server-side validation.
export const ChecklistInstanceItemNumberEntryCard = ({ item, instanceId, canWork, isLocked }: ChecklistInstanceItemNumberEntryCardProps) => {
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);
  const [draftValue, setDraftValue] = useState(item.numericValue != null ? String(item.numericValue) : '');

  const interactive = canWork && !isLocked;
  const parsed = draftValue.trim() === '' ? null : Number(draftValue);
  const outOfRange =
    parsed != null &&
    ((item.numberEntryMin != null && parsed < item.numberEntryMin) ||
      (item.numberEntryMax != null && parsed > item.numberEntryMax));
  const canSubmit = interactive && parsed != null && !Number.isNaN(parsed) && !outOfRange;

  const rangeHint = [
    item.numberEntryMin != null ? `min ${item.numberEntryMin}` : null,
    item.numberEntryMax != null ? `max ${item.numberEntryMax}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className={`flex flex-col gap-3 p-3 rounded-lg border border-border bg-surface ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${
          item.isDone ? 'bg-primary-500/10 text-primary-600' : 'bg-surface-hover text-text-light'
        }`}>
          <Hash size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-mono font-semibold leading-snug ${item.isDone ? 'text-text' : 'text-text'}`}>
            {item.label}
          </p>
          {(rangeHint || item.numberEntryUnit) && (
            <p className="text-[11px] text-text-muted font-mono mt-0.5">
              {[rangeHint, item.numberEntryUnit].filter(Boolean).join(' · ')}
            </p>
          )}
          {item.isDone && item.completedAt && (
            <p className="text-xs text-text-muted font-mono mt-0.5">Completed {formatDate(item.completedAt)}</p>
          )}
        </div>
        {interactive && item.isDone && (
          <button
            onClick={() => setItemDone.mutate({ itemId: item.id, isDone: false, numericValue: parsed ?? undefined })}
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
              {setItemDone.error instanceof Error ? setItemDone.error.message : 'Could not save this reading.'}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              disabled={item.isDone}
              placeholder="Enter value"
              className="w-32 px-2.5 py-1.5 text-sm font-mono bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-60"
            />
            {item.numberEntryUnit && <span className="text-xs font-mono text-text-muted">{item.numberEntryUnit}</span>}

            {!item.isDone && (
              <button
                onClick={() => parsed != null && setItemDone.mutate({ itemId: item.id, isDone: true, numericValue: parsed })}
                disabled={!canSubmit || setItemDone.isPending}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {setItemDone.isPending && <Loader2 size={12} className="animate-spin" />}
                Save reading
              </button>
            )}
          </div>

          {outOfRange && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Value is outside the allowed range{rangeHint ? ` (${rangeHint})` : ''}.</p>
          )}
        </div>
      )}
    </div>
  );
};
