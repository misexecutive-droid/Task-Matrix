import { useEffect, useMemo } from 'react';
import { RefreshCcw, Camera, ImageUp, X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components';
import { SECTION_HEADER, STATUS_UPDATE_OPTIONS } from './detailConstants';
import type { RestrictedStatus, CaptureMethod } from '../../../api/ticket';

interface TicketStatusUpdatePanelProps {
  statusPick: RestrictedStatus | null;
  onPickStatus: (status: RestrictedStatus) => void;
  statusRemark: string;
  onRemarkChange: (value: string) => void;
  statusPhotos: File[];
  onRemovePhoto: (index: number) => void;
  onAddPhotos: (files: FileList | null, method: CaptureMethod) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitErrorMessage: string | null;
}

const StatusPhotoThumbnail = ({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}) => {
  // Derived synchronously from `file` — no need to route it through state/effect, which would
  // cost an extra render (mount with an empty url, then the effect setting it).
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  return (
    <div className="group relative size-14 rounded-md border border-border overflow-hidden bg-surface-muted shrink-0 transition-all">
      {previewUrl && (
        <img src={previewUrl} alt={file.name} className="size-full object-cover" />
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 p-0.5 rounded-sm bg-surface/90 text-text-muted hover:text-danger hover:bg-surface border border-border/80 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm cursor-pointer"
        aria-label={`Remove ${file.name}`}
      >
        <X size={10} />
      </button>
    </div>
  );
};

export const TicketStatusUpdatePanel = ({
  statusPick,
  onPickStatus,
  statusRemark,
  onRemarkChange,
  statusPhotos,
  onRemovePhoto,
  onAddPhotos,
  onSubmit,
  isSubmitting,
  submitErrorMessage,
}: TicketStatusUpdatePanelProps) => {
  const isSubmitDisabled = !statusPick || !statusRemark.trim() || isSubmitting;

  return (
    <div className="px-4 py-3.5 border-t border-border/60 bg-surface/50 flex flex-col gap-3">
      <h3 className={`${SECTION_HEADER} flex items-center gap-1.5`}>
        <RefreshCcw size={13} className="text-text-muted" />
        <span>Update Status</span>
      </h3>

      <div className="grid grid-cols-3 gap-1.5">
        {STATUS_UPDATE_OPTIONS.map((opt) => {
          const isSelected = statusPick === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPickStatus(opt.value)}
              className={`text-xs font-medium px-2.5 py-2 rounded-md border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 cursor-pointer ${
                isSelected
                  ? 'border-primary-500/60 bg-primary-500/10 text-primary-500 font-semibold shadow-xs'
                  : 'border-border/80 bg-surface text-text-secondary hover:bg-surface-muted hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={statusRemark}
        onChange={(e) => onRemarkChange(e.target.value)}
        placeholder="Remark — explain what changed... (required)"
        rows={2}
        className="w-full px-3 py-2 text-xs bg-surface border border-border/80 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-text placeholder:text-text-muted/60 resize-none transition-all"
      />

      {statusPhotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusPhotos.map((file, index) => (
            <StatusPhotoThumbnail
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              onRemove={onRemovePhoto}
            />
          ))}
        </div>
      )}

      {submitErrorMessage && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
          <AlertCircle size={14} className="shrink-0" />
          <span>{submitErrorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-primary-500/40 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary-500/40">
            <Camera size={13} />
            <span>Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => {
                onAddPhotos(e.target.files, 'LIVE');
                e.target.value = '';
              }}
            />
          </label>

          <label className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border/80 text-text-secondary bg-surface hover:bg-surface-muted hover:text-text cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary-500/40">
            <ImageUp size={13} />
            <span>Gallery</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                onAddPhotos(e.target.files, 'GALLERY');
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <Button
          size="sm"
          variant="primary"
          className="font-medium text-xs gap-1.5 px-3.5 py-1.5 rounded-md"
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
          onClick={onSubmit}
        >
          Submit update
        </Button>
      </div>
    </div>
  );
};