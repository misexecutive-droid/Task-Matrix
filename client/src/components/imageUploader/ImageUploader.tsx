import { useRef, useState, useEffect, type DragEvent, type KeyboardEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  label?:    string;
  hint?:     string;
  files:     File[];
  onAdd:     (files: FileList | null) => void;
  onRemove:  (index: number) => void;
  accept?:   string;
  multiple?: boolean;
}

const ImagePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative aspect-square rounded-none border border-border overflow-hidden bg-surface-hover shrink-0">
      {url && <img src={url} alt={file.name} className="size-full object-cover" />}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-surface/90 text-text-muted hover:text-danger hover:bg-surface border border-border/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 shadow-sm cursor-pointer"
        aria-label={`Remove ${file.name}`}
      >
        <X size={12} />
      </button>
    </div>
  );
};

export const ImageUploader = ({
  label = 'Images',
  hint = 'PNG, JPG, WebP up to 10MB',
  files,
  onAdd,
  onRemove,
  accept = 'image/*',
  multiple = true,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-display font-medium text-text-secondary">{label}</label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }
        }}
        onDragOver={(e) => { stop(e); setIsDragging(true); }}
        onDragLeave={(e) => { stop(e); setIsDragging(false); }}
        onDrop={(e) => {
          stop(e); setIsDragging(false);
          if (e.dataTransfer.files.length > 0) onAdd(e.dataTransfer.files);
        }}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-none border border-dashed px-6 py-10 text-center cursor-pointer',
          'transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-primary-600/15',
          isDragging ? 'border-primary-600 bg-primary-600/5' : 'border-border hover:border-primary-600/50 hover:bg-surface-hover',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => { onAdd(e.target.files); e.target.value = ''; }}
        />

        <div className="flex items-center justify-center size-12 rounded-full bg-surface-hover text-text-muted">
          <UploadCloud size={20} />
        </div>

        <div>
          <p className="text-sm font-display font-medium text-text">Drag &amp; drop files here</p>
          <p className="text-xs font-medium text-text-muted mt-1">
            {hint} or{' '}
            <span className="text-primary-600 font-medium underline underline-offset-2">browse</span>
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-1">
          {files.map((file, i) => (
            <ImagePreview key={`${file.name}-${file.lastModified}-${i}`} file={file} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}
    </div>
  );
};
