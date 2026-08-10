import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { useSetChecklistInstanceItemDoneMutation } from '../hook';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';
import { formatDate } from '../checklistDisplay';

interface ChecklistInstanceItemTextCardProps {
  item:       ChecklistInstanceItem;
  instanceId: string;
  canWork:    boolean;
  isLocked:   boolean;
}

export const ChecklistInstanceItemTextCard = ({ item, instanceId, canWork, isLocked }: ChecklistInstanceItemTextCardProps) => {
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);
  const [draft, setDraft] = useState(item.textValue ?? '');
  const interactive = canWork && !isLocked;
  const canSubmit = interactive && draft.trim().length > 0;

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
            onClick={() => setItemDone.mutate({ itemId: item.id, isDone: false, textValue: draft })}
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

          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={item.isDone}
              placeholder="Type an answer…"
              className="flex-1 px-2.5 py-1.5 text-sm font-mono bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-60"
            />
            {!item.isDone && (
              <button
                onClick={() => canSubmit && setItemDone.mutate({ itemId: item.id, isDone: true, textValue: draft.trim() })}
                disabled={!canSubmit || setItemDone.isPending}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
