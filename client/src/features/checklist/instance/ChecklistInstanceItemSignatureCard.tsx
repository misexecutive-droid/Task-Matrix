import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { useSetChecklistInstanceItemDoneMutation } from '../hook';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';
import { formatDate } from '../checklistDisplay';
import { SignaturePadCanvas } from './SignaturePadCanvas';

interface ChecklistInstanceItemSignatureCardProps {
  item:       ChecklistInstanceItem;
  instanceId: string;
  canWork:    boolean;
  isLocked:   boolean;
}

export const ChecklistInstanceItemSignatureCard = ({ item, instanceId, canWork, isLocked }: ChecklistInstanceItemSignatureCardProps) => {
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);
  const [draft, setDraft] = useState<string | null>(item.signatureValue);
  const interactive = canWork && !isLocked;
  const label = item.signatureLabels?.[0] || 'Signature';

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
            onClick={() => setItemDone.mutate({ itemId: item.id, isDone: false, signatureValue: item.signatureValue ?? undefined })}
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
              {setItemDone.error instanceof Error ? setItemDone.error.message : 'Could not save this signature.'}
            </p>
          )}

          {item.isDone && item.signatureValue ? (
            <img src={item.signatureValue} alt={label} className="w-full max-w-sm h-[140px] object-contain rounded-md border border-border bg-white" />
          ) : (
            <>
              <SignaturePadCanvas label={label} disabled={item.isDone} onChange={setDraft} />
              {!item.isDone && (
                <button
                  onClick={() => draft && setItemDone.mutate({ itemId: item.id, isDone: true, signatureValue: draft })}
                  disabled={!draft || setItemDone.isPending}
                  className="w-fit flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {setItemDone.isPending && <Loader2 size={12} className="animate-spin" />}
                  Save
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
