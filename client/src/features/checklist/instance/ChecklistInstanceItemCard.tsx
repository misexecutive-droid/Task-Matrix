import { CheckSquare, Square, Camera, ImageUp, Video, X, Loader2, RotateCcw } from 'lucide-react';
import {
  useSetChecklistInstanceItemDoneMutation,
  useUploadChecklistInstanceImagesMutation,
  useDeleteChecklistInstanceImageMutation,
} from '../hook';
import type { ChecklistInstanceItem } from '../../../api/checklistInstances';
import type { CaptureMethod } from '../../../api/ticket';
import { formatDate } from '../checklistDisplay';

const UPLOADS_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

interface ChecklistInstanceItemCardProps {
  item:       ChecklistInstanceItem;
  instanceId: string;
  canWork:    boolean; // assignee or admin — allowed to upload/complete
  isLocked:   boolean; // instance already APPROVED — frozen, no further changes
}

const isVideoFile = (image: { mimeType: string }) => image.mimeType.startsWith('video/');

export const ChecklistInstanceItemCard = ({ item, instanceId, canWork, isLocked }: ChecklistInstanceItemCardProps) => {
  const setItemDone = useSetChecklistInstanceItemDoneMutation(instanceId);
  const uploadImages = useUploadChecklistInstanceImagesMutation(instanceId);
  const deleteImage = useDeleteChecklistInstanceImageMutation(instanceId);
  const isVideoItem = item.itemType === 'VIDEO_UPLOAD';
  const mediaWord = isVideoItem ? 'video' : 'photo';

  const images = item.images ?? [];
  const qualifying = item.requiresLivePhoto
    ? images.filter(i => i.captureMethod === 'LIVE').length
    : images.length;
  const photosSatisfied = item.requiredImageCount > 0 && qualifying >= item.requiredImageCount;
  const interactive = canWork && !isLocked;

  const handleFiles = (files: FileList | null, captureMethod: CaptureMethod) => {
    if (!files || !files.length) return;
    uploadImages.mutate({ itemId: item.id, files: Array.from(files), captureMethod });
  };

  // Plain items with no photo requirement keep the original snappy "click anywhere to toggle"
  // interaction — no need for the fuller evidence-capture card below.
  if (item.requiredImageCount === 0) {
    return (
      <button
        type="button"
        disabled={!interactive}
        onClick={() => setItemDone.mutate({ itemId: item.id, isDone: !item.isDone })}
        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
          interactive ? 'cursor-pointer hover:border-primary-500/30 hover:shadow-sm' : 'cursor-not-allowed opacity-75'
        } ${item.isDone ? 'border-border/50 bg-surface' : 'border-border bg-surface'}`}
      >
        <span className={`flex items-center justify-center size-7 rounded-lg shrink-0 transition-colors ${
          item.isDone ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface-hover text-text-light border border-border'
        }`}>
          {item.isDone ? <CheckSquare size={15} /> : <Square size={15} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-mono ${item.isDone ? 'line-through text-text-muted' : 'text-text'}`}>
            {item.label}
          </p>
          {item.isDone && item.completedAt && (
            <p className="text-[11px] text-text-muted font-mono mt-0.5">Completed {formatDate(item.completedAt)}</p>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-3 p-3 rounded-lg border border-border bg-surface ${isLocked ? 'opacity-75' : ''}`}>
      {/* Evidence requirement badge */}
      <div className="flex items-center gap-1.5">
        <span className={`flex items-center justify-center size-4 rounded shrink-0 ${photosSatisfied ? 'bg-emerald-500' : 'bg-amber-500'}`}>
          {isVideoItem ? <Video size={10} className="text-white" /> : <Camera size={10} className="text-white" />}
        </span>
        <span className="text-xs font-mono text-text-muted truncate">
          {qualifying}/{item.requiredImageCount} {mediaWord}{item.requiredImageCount !== 1 ? 's' : ''}
          {item.requiresLivePhoto ? ' (live only)' : ''}
          {item.maxImageCount != null ? ` · max ${item.maxImageCount}` : ''}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${
          item.isDone ? 'bg-primary-500/10 text-primary-600' : 'bg-surface-hover text-text-light'
        }`}>
          {item.isDone ? <CheckSquare size={18} /> : <Square size={18} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-mono font-semibold leading-snug ${item.isDone ? 'line-through text-text-muted' : 'text-text'}`}>
            {item.label}
          </p>
          {item.isDone && item.completedAt && (
            <p className="text-xs text-text-muted font-mono mt-0.5">Completed {formatDate(item.completedAt)}</p>
          )}
        </div>
        {interactive && item.isDone && (
          <button
            onClick={() => setItemDone.mutate({ itemId: item.id, isDone: false })}
            disabled={setItemDone.isPending}
            className="shrink-0 text-text-light hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Reopen item"
            title="Reopen"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Evidence media strip */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group/img">
              {isVideoFile(img) ? (
                <video
                  src={`${UPLOADS_BASE}${img.url}`}
                  className="size-16 object-cover rounded-md border border-border bg-surface-hover"
                  muted
                  playsInline
                  controls
                />
              ) : (
                <img
                  src={`${UPLOADS_BASE}${img.url}`}
                  alt={img.originalFilename ?? 'evidence'}
                  className="size-16 object-cover rounded-md border border-border"
                />
              )}
              <span className={`absolute -top-1 -left-1 text-[9px] font-mono px-1 rounded-full text-white ${
                img.captureMethod === 'LIVE' ? 'bg-emerald-500' : 'bg-text-light'
              }`}>
                {img.captureMethod === 'LIVE' ? 'Live' : 'Gallery'}
              </span>
              {interactive && (
                <button
                  onClick={() => deleteImage.mutate(img.id)}
                  className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-danger opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Delete image"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {interactive && !item.isDone && (
        <div className="flex flex-col gap-2">
          {uploadImages.isError && (
            <p className="text-xs text-danger">
              {uploadImages.error instanceof Error ? uploadImages.error.message : 'Upload failed.'}
            </p>
          )}
          {setItemDone.isError && (
            <p className="text-xs text-danger">
              {setItemDone.error instanceof Error ? setItemDone.error.message : 'Could not complete item.'}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <label className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-primary-500/50 text-primary-600 hover:bg-primary-500/10 cursor-pointer transition-colors">
              {isVideoItem ? <Video size={12} /> : <Camera size={12} />}
              {isVideoItem ? 'Record video' : 'Take photo'}
              <input
                type="file"
                accept={isVideoItem ? 'video/*' : 'image/*'}
                capture="environment"
                multiple
                className="hidden"
                onChange={e => { handleFiles(e.target.files, 'LIVE'); e.target.value = ''; }}
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-border text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors">
              <ImageUp size={12} />
              {isVideoItem ? 'Choose video' : 'Gallery'}
              <input
                type="file"
                accept={isVideoItem ? 'video/*' : 'image/*'}
                multiple
                className="hidden"
                onChange={e => { handleFiles(e.target.files, 'GALLERY'); e.target.value = ''; }}
              />
            </label>
            {uploadImages.isPending && <Loader2 size={13} className="animate-spin text-text-muted" />}

            <button
              onClick={() => setItemDone.mutate({ itemId: item.id, isDone: true })}
              disabled={setItemDone.isPending}
              className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50 ml-auto"
            >
              {setItemDone.isPending && <Loader2 size={12} className="animate-spin" />}
              Mark complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
