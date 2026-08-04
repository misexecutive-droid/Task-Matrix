import { Heart } from 'lucide-react';

interface ProductCardProps {
  title: string;
  image: string;
  description: string;
  price: string;
  ctaLabel?: string;
  saved?: boolean;
  onSave?: () => void;
  onOrder?: () => void;
  className?: string;
}

/** Generic media card: title + save toggle, image, description, price, and a primary CTA.
 *  Not wired to any feature yet — drop it wherever a title/image/price/action shape fits. */
export const ProductCard = ({
  title, image, description, price, ctaLabel = 'Order now', saved = false, onSave, onOrder, className = '',
}: ProductCardProps) => (
  <div className={`bg-surface border border-border shadow-sm w-full max-w-sm rounded-2xl overflow-hidden ${className}`}>
    <div className="px-4 py-3 sm:px-6 flex items-center justify-between gap-4 flex-wrap">
      <h3 className="text-text text-base font-display font-semibold">{title}</h3>

      <button
        type="button"
        onClick={onSave}
        aria-label="Save"
        title="Save this item"
        className="flex items-center gap-1 p-1 rounded-full text-text-muted hover:text-primary-500 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
      >
        <Heart size={18} className={saved ? 'fill-primary-500 text-primary-500' : 'fill-none'} />
      </button>
    </div>

    <div className="aspect-[3/2] w-full bg-surface-hover">
      <img src={image} className="w-full h-full object-cover" alt={title} />
    </div>

    <div className="p-4 sm:p-6">
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>

      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xl text-text font-display font-bold">{price}</span>
        <button
          type="button"
          onClick={onOrder}
          className="inline-flex items-center py-2 px-3.5 text-sm rounded-md font-display font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  </div>
);
