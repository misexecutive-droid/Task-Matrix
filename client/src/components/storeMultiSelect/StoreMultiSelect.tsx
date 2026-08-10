import { Loader2 } from 'lucide-react';
import { useStoresQuery } from '../../features/tickets/hook';

interface StoreMultiSelectProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

// Picks every store a checklist definition is live in — a checklist can run in several stores at
// once, so this is a checkbox list rather than a single-value dropdown (same shape as
// UserMultiSelect, just scoped to stores instead of department-scoped users).
export const StoreMultiSelect = ({ selected, onChange }: StoreMultiSelectProps) => {
  const { data: stores, isLoading } = useStoresQuery();

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-2.5 bg-surface border border-border rounded-lg">
      {isLoading && (
        <p className="flex items-center gap-2 text-xs font-display text-text-muted px-2 py-2">
          <Loader2 size={13} className="animate-spin" /> Loading stores…
        </p>
      )}
      {!isLoading && !stores?.length && (
        <p className="text-xs font-display text-text-muted px-2 py-2">No stores configured yet.</p>
      )}
      {stores?.map(s => {
        const checked = selected.includes(s.id);
        return (
          <label
            key={s.id}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm font-display text-text cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <input
              type="checkbox"
              className="accent-primary-600 size-3.5"
              checked={checked}
              onChange={() => toggle(s.id)}
            />
            {s.name}
          </label>
        );
      })}
    </div>
  );
};
