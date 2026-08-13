import { useEffect, useRef, useState } from 'react';
import { Paperclip, UploadCloud, X } from 'lucide-react';
import { ACCEPTED_ATTACHMENT_TYPES, isImageAttachment, attachmentIconFor, attachmentTypeLabel, formatFileSize } from './taskAttachmentDisplay';
import { FIELD_LABEL_CLASS } from './taskFormFieldStyles';

interface TaskAttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

/** Local thumbnail for a staged image file — creates its own object URL once and revokes
 *  it on unmount, instead of minting a fresh (and never-released) one on every render. */
const StagedImageThumb = ({ file }: { file: File }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;
  return <img src={url} alt={file.name} className="w-full h-full object-cover" />;
};

/** Local, pre-upload file picker for the Create Task form — there's no task id yet to
 *  upload against, so files are just staged here and handed off to the real upload
 *  mutation once the task is created (see TaskForm's onSubmit). */
export const TaskAttachmentPicker = ({ files, onChange }: TaskAttachmentPickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list || !list.length) return;
    onChange([...files, ...Array.from(list)]);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="group/field space-y-2">
      <label className={FIELD_LABEL_CLASS}>
        <Paperclip className="w-3.5 h-3.5 text-text-light group-hover/field:text-primary-500 transition-colors" /> Reference Files
      </label>

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
        className="group border border-dashed border-border hover:border-primary-500/50 bg-surface-hover/40 hover:bg-primary-500/5 p-4 rounded flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_ATTACHMENT_TYPES}
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="p-2 rounded-full bg-surface group-hover:bg-primary-500/10 text-text-muted group-hover:text-primary-500 transition-colors mb-1.5">
          <UploadCloud size={18} />
        </div>
        <p className="text-xs font-medium text-text group-hover:text-primary-500 transition-colors">
          Click or drop files here
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">PDF, CSV, photos, or videos — attached once the task is created</p>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((file, i) => {
            const Icon = attachmentIconFor(file.type);
            const isImage = isImageAttachment(file.type);
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded border border-border bg-surface text-sm"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded bg-surface-hover shrink-0 overflow-hidden">
                  {isImage ? (
                    <StagedImageThumb file={file} />
                  ) : (
                    <Icon size={16} className="text-text-light" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text truncate">{file.name}</p>
                  <p className="text-[10px] text-text-muted">{attachmentTypeLabel(file.type)} · {formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${file.name}`}
                  className="p-1 text-text-light hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
