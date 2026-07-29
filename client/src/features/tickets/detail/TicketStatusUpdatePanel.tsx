import { RefreshCcw, Camera, ImageUp, X } from 'lucide-react';
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

// Restricted status-update flow for whoever is actually doing the work (assignee, creator, or a
// manager): only In Progress/On Hold/Completed, always with a remark, plus optional live/gallery
// evidence photos. Verifiers (PC/Admin) use the full dropdown in the Quick Attributes card instead.
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
}: TicketStatusUpdatePanelProps) => (
  <div className="px-4 pt-3 pb-3 border-t border-border/40 bg-surface/50 flex flex-col gap-2.5">
    <h3 className={SECTION_HEADER}>
      <RefreshCcw size={13} /> Update Status
    </h3>

    <div className="grid grid-cols-3 gap-1.5">
      {STATUS_UPDATE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onPickStatus(opt.value)}
          className={`text-xs font-display font-medium px-2 py-2 rounded-md border transition-all text-center ${
            statusPick === opt.value
              ? 'border-primary-500/60 bg-primary-500/10 text-primary-500 ring-2 ring-primary-500/20'
              : 'border-border/60 bg-surface text-text-secondary hover:bg-surface-hover'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>

    <textarea
      value={statusRemark}
      onChange={e => onRemarkChange(e.target.value)}
      placeholder="Remark — what changed? (required)"
      rows={2}
      className="w-full px-3 py-2 text-xs font-display bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50"
    />

    {statusPhotos.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {statusPhotos.map((file, i) => (
          <div key={i} className="relative size-14 rounded-md border border-border overflow-hidden">
            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemovePhoto(i)}
              className="absolute -top-1 -right-1 size-4 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-danger cursor-pointer"
              aria-label="Remove photo"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    )}

    {submitErrorMessage && (
      <p className="text-xs text-danger">{submitErrorMessage}</p>
    )}

    <div className="flex items-center gap-2 flex-wrap">
      <label className="flex items-center gap-1.5 text-xs font-display font-medium px-2.5 py-1.5 rounded-md border border-primary-500/50 text-primary-600 hover:bg-primary-500/10 cursor-pointer transition-colors">
        <Camera size={12} />
        Take photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={e => { onAddPhotos(e.target.files, 'LIVE'); e.target.value = ''; }}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs font-display font-medium px-2.5 py-1.5 rounded-md border border-border text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors">
        <ImageUp size={12} />
        Gallery
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { onAddPhotos(e.target.files, 'GALLERY'); e.target.value = ''; }}
        />
      </label>

      <Button
        size="sm"
        variant="primary"
        className="ml-auto font-display text-xs gap-1.5"
        disabled={!statusPick || !statusRemark.trim()}
        isLoading={isSubmitting}
        onClick={onSubmit}
      >
        Submit update
      </Button>
    </div>
  </div>
);
