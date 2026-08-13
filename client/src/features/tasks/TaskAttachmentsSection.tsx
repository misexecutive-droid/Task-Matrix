import { useRef } from 'react';
import { Paperclip, UploadCloud, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useUploadTaskAttachmentsMutation, useDeleteTaskAttachmentMutation } from './hook';
import { ACCEPTED_ATTACHMENT_TYPES, isImageAttachment, attachmentIconFor, attachmentTypeLabel, formatFileSize } from './taskAttachmentDisplay';
import { UPLOADS_BASE } from '../../lib/uploadsBase';
import type { TaskAttachment } from '../../api/task';

interface TaskAttachmentsSectionProps {
  taskId: string;
  attachments: TaskAttachment[];
  /** Whether the current viewer (owner, assignee, or admin) may upload/delete — read-only otherwise. */
  canManage: boolean;
}

/** Reference docs/photos/videos attached directly to the task — separate from checklist
 *  items' own required-photo evidence. Lets the assignee see everything they need for the
 *  task (specs, screenshots, walkthrough clips) and add their own files back. */
export const TaskAttachmentsSection = ({ taskId, attachments, canManage }: TaskAttachmentsSectionProps) => {
  const uploadMutation = useUploadTaskAttachmentsMutation(taskId);
  const deleteMutation = useDeleteTaskAttachmentMutation(taskId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files || !files.length) return;
    uploadMutation.mutate(Array.from(files));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider select-none">
          <Paperclip size={13} className="text-primary-400" /> Attachments
        </h3>
        <span className="text-[11px] text-text-muted">{attachments.length} file{attachments.length === 1 ? '' : 's'}</span>
      </div>

      {canManage && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          className="group border border-dashed border-border hover:border-primary-500/50 bg-surface-hover/30 hover:bg-primary-500/5 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_ATTACHMENT_TYPES}
            multiple
            className="hidden"
            onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }}
          />
          <div className="p-2 rounded-full bg-surface group-hover:bg-primary-500/10 text-text-muted group-hover:text-primary-500 transition-colors mb-1.5">
            {uploadMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
          </div>
          <p className="text-xs font-medium text-text group-hover:text-primary-500 transition-colors">
            {uploadMutation.isPending ? 'Uploading...' : 'Click or drop files here'}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">PDF, CSV, photos, or videos — up to 25MB each</p>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="flex items-center gap-2 text-xs text-danger">
          <AlertCircle size={13} className="shrink-0" />
          {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Failed to upload files.'}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {attachments.map((file) => {
            const Icon = attachmentIconFor(file.mimeType);
            const isImage = isImageAttachment(file.mimeType);
            return (
              <div
                key={file.id}
                className="group relative rounded-lg border border-border bg-surface overflow-hidden shadow-2xs"
              >
                <a
                  href={`${UPLOADS_BASE}${file.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col"
                  title={file.originalFilename ?? attachmentTypeLabel(file.mimeType)}
                >
                  <div className="aspect-square flex items-center justify-center bg-surface-hover/60">
                    {isImage ? (
                      <img
                        src={`${UPLOADS_BASE}${file.url}`}
                        alt={file.originalFilename ?? 'attachment'}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Icon size={28} className="text-text-light" />
                    )}
                  </div>
                  <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] font-medium text-text truncate">
                      {file.originalFilename ?? attachmentTypeLabel(file.mimeType)}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {attachmentTypeLabel(file.mimeType)} · {formatFileSize(file.sizeBytes)}
                    </span>
                  </div>
                </a>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    aria-label="Remove attachment"
                    title="Remove attachment"
                    className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-danger/90 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-danger hover:scale-105 cursor-pointer shadow-2xs outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-danger/50 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} strokeWidth={2.5} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
