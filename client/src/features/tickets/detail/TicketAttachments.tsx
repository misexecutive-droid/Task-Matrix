import { useRef } from 'react';
import { UploadCloud, Paperclip, Eye, Trash2 } from 'lucide-react';
import { SECTION_HEADER, UPLOADS_BASE } from './detailConstants';
import type { TicketAttachment } from '../../../api/ticket';

interface TicketAttachmentsProps {
  attachments: TicketAttachment[];
  onUpload: (files: FileList | null) => void;
  isUploading: boolean;
  uploadErrorMessage: string | null;
  onDelete: (attachmentId: string) => void;
  isDeleting: boolean;
  onPreview: (url: string) => void;
}

export const TicketAttachments = ({
  attachments,
  onUpload,
  isUploading,
  uploadErrorMessage,
  onDelete,
  isDeleting,
  onPreview,
}: TicketAttachmentsProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className={SECTION_HEADER}>
          <Paperclip size={13} /> Attachments & Screenshots
        </h3>
        <span className="text-[11px] text-text-muted">{attachments.length} files</span>
      </div>

      {/* Dropzone Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group border border-dashed border-border/80 hover:border-primary-500/50 bg-surface/40 hover:bg-primary-500/5 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }}
        />
        <div className="p-2 rounded-full bg-surface-muted group-hover:bg-primary-500/10 text-text-muted group-hover:text-primary-500 transition-colors mb-1.5">
          <UploadCloud size={18} />
        </div>
        <p className="text-xs font-medium text-text group-hover:text-primary-500 transition-colors">
          {isUploading ? 'Uploading...' : 'Click or drop pictures here'}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">PNG, JPG, WEBP up to 10MB</p>
      </div>

      {uploadErrorMessage && (
        <p className="text-xs text-danger">{uploadErrorMessage}</p>
      )}

      {/* Attachments Preview Grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mt-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-lg border border-border/60 bg-surface overflow-hidden aspect-square flex items-center justify-center shadow-2xs"
            >
              <img
                src={`${UPLOADS_BASE}${file.url}`}
                alt={file.originalFilename ?? 'attachment'}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />

              {/* Uploader Attribution */}
              {file.uploadedBy && (
                <span className="absolute bottom-1 left-1 max-w-[calc(100%-0.5rem)] truncate text-[9px] font-display font-medium px-1.5 py-0.5 rounded bg-black/60 text-white">
                  {file.uploadedBy.firstName}
                </span>
              )}

              {/* Image Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(`${UPLOADS_BASE}${file.url}`)}
                  className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
                  title="View image"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(file.id)}
                  disabled={isDeleting}
                  className="p-1.5 rounded-full bg-rose-500/80 text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
