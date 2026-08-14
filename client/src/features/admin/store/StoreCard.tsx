import { Trash2, Pencil, Store as StoreIcon, Users, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Store } from '../../../api/stores';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StoreCardProps {
  store: Store;
  memberCount: number;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (store: Store) => void;
  onDelete: (id: string) => void;
}

export const StoreCard = ({ store, memberCount, isUpdating, isDeleting, onToggleActive, onEdit, onDelete }: StoreCardProps) => (
  <article
    className={cn(
      'group relative flex flex-col justify-between p-5 sm:p-6',
      'bg-surface rounded-2xl border border-border shadow-sm',
      'transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-primary-200',
      isDeleting && 'opacity-50 pointer-events-none grayscale-[0.3]',
    )}
  >
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center justify-center text-coral-600 dark:text-coral-400 shrink-0">
          <StoreIcon className="w-6 h-6" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-base sm:text-lg font-display font-bold text-text truncate" title={store.name}>
            {store.name}
          </h3>
          {store.code && <p className="text-xs font-display text-text-muted truncate">{store.code}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggleActive(store.id, store.isActive)}
        disabled={isUpdating}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold tracking-wide uppercase shrink-0 transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          store.isActive
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 focus-visible:ring-emerald-500'
            : 'bg-surface-hover text-text-muted hover:bg-surface-active focus-visible:ring-border',
          isUpdating && 'opacity-70 cursor-not-allowed',
        )}
      >
        {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {store.isActive ? 'Active' : 'Inactive'}
      </button>
    </header>

    {store.address && <p className="text-sm text-text-muted mb-4 truncate">{store.address}</p>}

    <footer className="flex items-center justify-between pt-4 border-t border-border/60 mt-auto">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover text-text-secondary text-sm font-display font-medium border border-border/50">
        <Users className="w-4 h-4 text-text-light shrink-0" />
        <span>{memberCount} {memberCount === 1 ? 'staff' : 'staff'}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(store)}
          className="p-2 rounded-xl text-text-light transition-all duration-200 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={`Edit ${store.name} store`}
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(store.id)}
          disabled={isDeleting}
          className={cn(
            'p-2 rounded-xl text-text-light transition-all duration-200 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger',
            isDeleting && 'opacity-50 cursor-not-allowed',
          )}
          aria-label={`Delete ${store.name} store`}
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-danger" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </footer>
  </article>
);
