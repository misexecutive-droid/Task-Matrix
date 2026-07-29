import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

export const ImageLightbox = ({ src, onClose }: ImageLightboxProps) => {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-2xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
        >
          <X size={16} />
        </button>
        <img src={src} alt="Enlarged preview" className="object-contain max-h-[80vh] w-auto" />
      </div>
    </div>
  );
};
