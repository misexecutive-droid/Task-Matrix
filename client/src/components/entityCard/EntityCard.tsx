import type { LucideIcon } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader } from '../loaders/Loader';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Shared visual language for the Users / Departments / Stores cards — one definition so the
// three entity types read as one design system instead of three hand-drifted lookalikes.

export const ENTITY_CARD_CLASS =
  'group relative flex flex-col justify-between p-3 sm:p-3.5 bg-surface rounded-xl border border-border shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-primary-200';

interface EntityIconTileProps {
  icon: LucideIcon;
  /** primary (navy) for org structure — users, departments; coral (gold) for physical stores. */
  tone?: 'primary' | 'coral';
  className?: string;
}

// The leading visual for Departments/Stores — sized and shaped to match the User card's avatar
// circle (same 40px footprint), so every card's header reads at the same visual weight.
export const EntityIconTile = ({ icon: Icon, tone = 'primary', className }: EntityIconTileProps) => (
  <div
    className={cn(
      'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ring-1',
      tone === 'coral'
        ? 'bg-coral-500/10 text-coral-600 dark:text-coral-400 ring-coral-500/10'
        : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-primary-500/10',
      className
    )}
  >
    <Icon className="w-3.5 h-3.5" />
  </div>
);

interface StatusPillProps {
  active: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

// Identical Active/Inactive toggle used by all three entity cards.
export const StatusPill = ({ active, isUpdating, onToggle, ariaLabel }: StatusPillProps) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={isUpdating}
    aria-label={ariaLabel}
    className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-display font-semibold shrink-0 transition-all duration-300',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      active
        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 focus-visible:ring-emerald-500'
        : 'bg-surface-hover text-text-muted hover:bg-surface-active focus-visible:ring-border',
      isUpdating && 'opacity-70 cursor-not-allowed'
    )}
  >
    {isUpdating && <Loader size="sm" variant="slate" className="w-3 h-3" />}
    {active ? 'Active' : 'Inactive'}
  </button>
);

interface MetricPillProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

export const MetricPill = ({ icon: Icon, children }: MetricPillProps) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-hover text-text-secondary text-[11px] font-display font-medium border border-border/50">
    <Icon className="w-3 h-3 text-text-light shrink-0" />
    <span>{children}</span>
  </div>
);

interface EntityCardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  editLabel: string;
  deleteLabel: string;
}
  
export const EntityCardActions = ({ onEdit, onDelete, isDeleting, editLabel, deleteLabel }: EntityCardActionsProps) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={onEdit}
      className="p-1 rounded-md text-text-light transition-all duration-200 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      aria-label={editLabel}
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>

    <button
      type="button"
      onClick={onDelete}
      disabled={isDeleting}
      className={cn(
        'p-1 rounded-md text-text-light transition-all duration-200 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger',
        isDeleting && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={deleteLabel}
    >
      {isDeleting ? <Loader size="sm" variant="rose" className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  </div>
);
