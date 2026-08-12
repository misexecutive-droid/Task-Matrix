import { useRef, useState, useEffect, type DragEvent, type KeyboardEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImageUploaderProps {
  label?: string;
  hint?: string;
  files: File[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  accept?: string;
  multiple?: boolean;
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative aspect-square rounded-md border border-border overflow-hidden bg-surface-hover shrink-0 shadow-sm">
      {url && <img src={url} alt={file.name} className="size-full object-cover" />}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-surface/90 text-text-muted hover:text-danger hover:bg-surface border border-border opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 shadow-sm cursor-pointer"
        aria-label={`Remove ${file.name}`}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function ImageUploader({
  label = 'Images',
  hint = 'PNG, JPG, WebP up to 10MB',
  files,
  onAdd,
  onRemove,
  accept = 'image/*',
  multiple = true,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          stop(e);
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          stop(e);
          setIsDragging(false);
        }}
        onDrop={(e) => {
          stop(e);
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) onAdd(e.dataTransfer.files);
        }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-8 text-center cursor-pointer',
          'transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:border-primary-400',
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-border-hover hover:border-primary-400 hover:bg-surface-hover'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            onAdd(e.target.files);
            e.target.value = ''; // Reset so the same file can be uploaded again if removed
          }}
        />

        <div className="flex items-center justify-center size-10 rounded-full bg-primary-50 text-primary-700">
          <UploadCloud size={18} />
        </div>

        <div>
          <p className="text-sm font-semibold text-text">Drag &amp; drop files here</p>
          <p className="text-xs text-text-muted mt-1">
            {hint} or{' '}
            <span className="text-coral-600 font-bold hover:text-coral-700 transition-colors">
              browse
            </span>
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-2">
          {files.map((file, i) => (
            <ImagePreview
              key={`${file.name}-${file.lastModified}-${i}`}
              file={file}
              onRemove={() => onRemove(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}