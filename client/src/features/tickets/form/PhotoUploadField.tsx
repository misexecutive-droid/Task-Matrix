import { useRef, useState, useEffect, DragEvent, KeyboardEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { LABEL_CLASS } from './formConstants';

interface PhotoUploadFieldProps {
  photos: File[];
  onAddPhotos: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
}

// Memory-safe thumbnail preview component
const PhotoThumbnail = ({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Clean up memory when image is removed or unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative size-16 rounded-md border border-border overflow-hidden bg-surface-muted shrink-0 transition-all">
      {previewUrl && (
        <img src={previewUrl} alt={file.name} className="size-full object-cover" />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-1 right-1 p-0.5 rounded-sm bg-surface/90 text-text-muted hover:text-danger hover:bg-surface border border-border/80 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm cursor-pointer"
        aria-label={`Remove ${file.name}`}
      >
        <X size={12} />
      </button>
    </div>
  );
};

export const PhotoUploadField = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
}: PhotoUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddPhotos(e.dataTransfer.files);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>Photos (optional)</label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative border border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-border hover:border-primary-500/60 bg-surface/30 hover:bg-surface-muted/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onAddPhotos(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="p-2 rounded-md bg-surface-muted group-hover:bg-primary-500/10 text-text-muted group-hover:text-primary-500 transition-colors mb-2 border border-border/50">
          <UploadCloud className="size-4" />
        </div>

        <div className="text-center">
          <p className="text-xs font-medium text-text group-hover:text-primary-500 transition-colors">
            <span className="font-semibold underline decoration-border underline-offset-2 group-hover:decoration-primary-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </p>
          <p className="text-[11px] text-text-muted mt-1">PNG, JPG, WEBP up to 10MB</p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {photos.map((file, index) => (
            <PhotoThumbnail
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              onRemove={onRemovePhoto}
            />
          ))}
        </div>
      )}
    </div>
  );
};