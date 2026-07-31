import { ImageUploader } from '../../../components';

interface PhotoUploadFieldProps {
  photos: File[];
  onAddPhotos: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
}

export const PhotoUploadField = ({ photos, onAddPhotos, onRemovePhoto }: PhotoUploadFieldProps) => (
  <ImageUploader
    label="Photos (optional)"
    hint="PNG, JPG, WEBP up to 10MB"
    files={photos}
    onAdd={onAddPhotos}
    onRemove={onRemovePhoto}
  />
);
