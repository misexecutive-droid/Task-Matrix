import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader } from '../loaders/Loader';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Pinned as the first, always-present option (e.g. "No department") — its value is typically ''. */
  emptyOptionLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Wraps the substring of `label` that matches `query` in a <mark> — lets a long list read as
// "type 2-3 letters, see exactly why each result matched" instead of a plain filtered list.
const highlightMatch = (label: string, query: string): ReactNode => {
  if (!query) return label;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-primary-500/20 text-primary-700 dark:text-primary-400 rounded-sm">
        {label.slice(idx, idx + query.length)}
      </mark>
      {label.slice(idx + query.length)}
    </>
  );
};

// A searchable, keyboard-navigable dropdown — type a few letters to filter instead of scrolling
// a plain list. Built on plain positioning (no portal/popover dependency) since it only ever
// needs to anchor directly under its own input inside a form.
export const Combobox = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  emptyOptionLabel,
  isLoading,
  disabled,
  className,
}: ComboboxProps) => {
  const allOptions = useMemo<ComboboxOption[]>(
    () => (emptyOptionLabel !== undefined ? [{ value: '', label: emptyOptionLabel }, ...options] : options),
    [options, emptyOptionLabel]
  );
  const selected = allOptions.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Adjust the displayed text during render (not an Effect) whenever `value` changes from
  // outside — e.g. switching which record is being edited loads a different default value.
  // This is React's documented pattern for syncing state from props without a cascading Effect.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(selected?.label ?? '');
  }

  const trimmedQuery = query.trim();
  const isSearching = open && trimmedQuery.length > 0 && trimmedQuery !== selected?.label;
  const filtered = useMemo(
    () => (isSearching ? allOptions.filter((o) => o.label.toLowerCase().includes(trimmedQuery.toLowerCase())) : allOptions),
    [allOptions, isSearching, trimmedQuery]
  );
  // Clamp rather than reset-via-effect: if the list shrinks (e.g. typing narrows it further),
  // the cursor just settles on the new last item instead of needing a synced side effect.
  const safeHighlightedIndex = Math.min(highlightedIndex, Math.max(filtered.length - 1, 0));

  // A real subscription to an external system (DOM click events) — not a state-sync-from-props
  // case, so this one legitimately belongs in an Effect.
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? '');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [selected]);

  const openList = () => {
    setOpen(true);
    setHighlightedIndex(0);
  };

  const commit = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') openList();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(Math.min(safeHighlightedIndex + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(Math.max(safeHighlightedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filtered[safeHighlightedIndex];
      if (option) commit(option);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(selected?.label ?? '');
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="press-feedback relative flex items-center rounded-md">
        <Search size={14} className="absolute left-3 text-text-light pointer-events-none" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled || isLoading}
          value={query}
          placeholder={isLoading ? 'Loading...' : placeholder}
          onFocus={openList}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full h-10 rounded-md border border-border bg-surface text-text placeholder:text-text-light',
            'pl-9 pr-9 text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:border-primary-400 focus:ring-coral-400/30',
            'disabled:bg-surface-hover disabled:text-text-light disabled:cursor-not-allowed'
          )}
        />
        {isLoading ? (
          <Loader size="sm" variant="slate" className="absolute right-3 w-3.5 h-3.5" />
        ) : (
          <ChevronDown
            size={14}
            className={cn('absolute right-3 text-text-light transition-transform duration-200', open && 'rotate-180')}
          />
        )}
      </div>

      {open && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-text-muted font-display">No matches</li>
          ) : (
            filtered.map((option, i) => (
              <li
                key={option.value || '__empty__'}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(option);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 text-sm font-display cursor-pointer transition-colors',
                  i === safeHighlightedIndex ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400' : 'text-text hover:bg-surface-hover',
                  !option.value && 'text-text-muted italic'
                )}
              >
                <span className="truncate">{highlightMatch(option.label, isSearching ? trimmedQuery : '')}</span>
                {option.value === value && <Check size={14} className="shrink-0 text-primary-600 dark:text-primary-400" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
