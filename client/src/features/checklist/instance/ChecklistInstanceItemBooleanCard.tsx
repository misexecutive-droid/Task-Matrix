import { useState } from 'react';
import { RotateCcw, Camera, ImageUp, X, Loader2, Zap } from 'lucide-react';
import {
  useSetChecklistInstanceItemDoneMutation,
  useUploadChecklistInstanceImagesMutation,
  useDeleteChecklistInstanceImageMutation,
} from '../hook';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';
import type { ChecklistConditionalAction } from '../../../api/checklistDefinitions';
import type { CaptureMethod } from '../../../api/ticket';
import { formatDate } from '../checklistDisplay';

const UPLOADS_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

interface ChecklistInstanceItemBooleanCardProps {
  item:       ChecklistInstanceItem;
  instanceId: string;
  canWork:    boolean;
  isLocked:   boolean;
}

// Shared by YES_NO and PASS_FAIL — same booleanAnswer field and interaction, just different
// button labels (Yes/No vs Pass/Fail) for the same underlying two-way question.
const LABELS_BY_ITEM_TYPE: Partial<Record<ChecklistInstanceItem['itemType'], { yes: string; no: string }>> = {
  YES_NO: { yes: 'Yes', no: 'No' },
  PASS_FAIL: { yes: 'Pass', no: 'Fail' },
};

const ACTION_HINT: Record<ChecklistConditionalAction, string> = {
  REQUIRE_PHOTO: 'a photo',
  ASK_REASON: 'a reason',
  CREATE_ISSUE: 'an issue will be raised',
  NOTIFY_AREA_MANAGER: 'the area manager will be notified',
};

export const ChecklistInstanceItemBooleanCard = ({ item, instanceId, canWork, isLocked }: ChecklistInstanceItemBooleanCardProps) => {
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);
  const uploadImages = useUploadChecklistInstanceImagesMutation(instanceId);
  const deleteImage = useDeleteChecklistInstanceImageMutation(instanceId);
  const labels = LABELS_BY_ITEM_TYPE[item.itemType] ?? LABELS_BY_ITEM_TYPE.YES_NO!;
  const interactive = canWork && !isLocked;

  // Builder-authored "if answer is X then:" rule (see ChecklistDefinitionItem.conditionalTrigger)
  // — clicking the triggering answer doesn't submit immediately, it reveals whatever the rule
  // requires (a reason, a photo) first, gated behind a separate Confirm step.
  const actions = item.conditionalActions ?? [];
  const requiresPhoto = actions.includes('REQUIRE_PHOTO');
  const requiresReason = actions.includes('ASK_REASON');
  const isTriggering = (value: 'YES' | 'NO') => item.conditionalTrigger === value && actions.length > 0;

  const [pendingAnswer, setPendingAnswer] = useState<'YES' | 'NO' | null>(null);
  const [reasonDraft, setReasonDraft] = useState(item.conditionalReasonValue ?? '');
  const images = item.images ?? [];

  const pickAnswer = (value: 'YES' | 'NO') => {
    if (!interactive || setItemDone.isPending) return;
    if (isTriggering(value)) {
      setPendingAnswer(value);
      return;
    }
    setItemDone.mutate({ itemId: item.id, isDone: true, booleanAnswer: value });
  };

  const canConfirm =
    (!requiresReason || reasonDraft.trim().length > 0) &&
    (!requiresPhoto || images.length > 0);

  const confirmPendingAnswer = () => {
    if (!pendingAnswer || !canConfirm) return;
    setItemDone.mutate(
      {
        itemId: item.id,
        isDone: true,
        booleanAnswer: pendingAnswer,
        conditionalReasonValue: requiresReason ? reasonDraft.trim() : undefined,
      },
      { onSuccess: () => setPendingAnswer(null) },
    );
  };

  const handleFiles = (files: FileList | null, captureMethod: CaptureMethod) => {
    if (!files || !files.length) return;
    uploadImages.mutate({ itemId: item.id, files: Array.from(files), captureMethod });
  };

  // Follow-up UI shows while confirming a pending trigger answer, or read-only afterward if the
  // item was already completed with the triggering answer (so the reason/photos stay visible).
  const showFollowUp = pendingAnswer != null || (item.isDone && isTriggering((item.booleanAnswer ?? '') as 'YES' | 'NO'));

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
            onClick={() => { setPendingAnswer(null); setItemDone.mutate({ itemId: item.id, isDone: false, booleanAnswer: item.booleanAnswer ?? undefined }); }}
            disabled={setItemDone.isPending}
            className="shrink-0 text-text-light hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Reopen item"
            title="Reopen"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {setItemDone.isError && (
        <p className="text-xs text-danger">
          {setItemDone.error instanceof Error ? setItemDone.error.message : 'Could not save this answer.'}
        </p>
      )}

      {!item.isDone && !pendingAnswer && item.conditionalTrigger && actions.length > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] font-mono text-coral-700 dark:text-coral-400">
          <Zap size={11} className="shrink-0" />
          If you answer {item.conditionalTrigger === 'YES' ? labels.yes : labels.no}, you'll need to provide {actions.map(a => ACTION_HINT[a]).join(', ')}.
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!interactive || item.isDone}
          onClick={() => pickAnswer('YES')}
          className={`flex-1 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors ${
            (pendingAnswer ?? item.booleanAnswer) === 'YES'
              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-border text-text-secondary hover:bg-surface-hover'
          } ${!interactive || item.isDone ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {labels.yes}
        </button>
        <button
          type="button"
          disabled={!interactive || item.isDone}
          onClick={() => pickAnswer('NO')}
          className={`flex-1 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors ${
            (pendingAnswer ?? item.booleanAnswer) === 'NO'
              ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'border-border text-text-secondary hover:bg-surface-hover'
          } ${!interactive || item.isDone ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {labels.no}
        </button>
      </div>

      {showFollowUp && (
        <div className="flex flex-col gap-2.5 pt-2.5 border-t border-dashed border-border/60">
          {requiresReason && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-text-muted">Reason</span>
              {pendingAnswer ? (
                <textarea
                  value={reasonDraft}
                  onChange={e => setReasonDraft(e.target.value)}
                  rows={2}
                  placeholder="Why? (required)"
                  className="w-full px-2.5 py-2 text-xs font-mono bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-y"
                />
              ) : (
                <p className="text-xs font-mono text-text italic">"{item.conditionalReasonValue}"</p>
              )}
            </div>
          )}

          {requiresPhoto && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-mono text-text-muted">
                Photo {images.length > 0 ? `(${images.length})` : '(required)'}
              </span>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map(img => (
                    <div key={img.id} className="relative group/img">
                      <img
                        src={`${UPLOADS_BASE}${img.url}`}
                        alt={img.originalFilename ?? 'evidence'}
                        className="size-14 object-cover rounded-md border border-border"
                      />
                      {pendingAnswer && (
                        <button
                          onClick={() => deleteImage.mutate(img.id)}
                          className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-danger opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Delete image"
                        >
                          <X size={9} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {pendingAnswer && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border border-primary-500/50 text-primary-600 hover:bg-primary-500/10 cursor-pointer transition-colors">
                    <Camera size={11} />
                    Take photo
                    <input type="file" accept="image/*" capture="environment" multiple className="hidden"
                      onChange={e => { handleFiles(e.target.files, 'LIVE'); e.target.value = ''; }} />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border border-border text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors">
                    <ImageUp size={11} />
                    Gallery
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { handleFiles(e.target.files, 'GALLERY'); e.target.value = ''; }} />
                  </label>
                  {uploadImages.isPending && <Loader2 size={12} className="animate-spin text-text-muted" />}
                </div>
              )}
            </div>
          )}

          {pendingAnswer && (
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setPendingAnswer(null); setReasonDraft(item.conditionalReasonValue ?? ''); }}
                className="text-xs font-mono font-medium px-2.5 py-1 rounded-md text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingAnswer}
                disabled={!canConfirm || setItemDone.isPending}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setItemDone.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm answer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
