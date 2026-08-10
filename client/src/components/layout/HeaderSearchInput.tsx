import { Search, X } from 'lucide-react';

interface HeaderSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const HeaderSearchInput = ({ value, onChange, placeholder = 'Search…' }: HeaderSearchInputProps) => (
  <div className="relative w-full">
    <Search
      size={15}
      strokeWidth={2}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 pl-9 pr-8 rounded-full border border-border/60 bg-surface-hover/60 text-sm text-text placeholder:text-text-muted/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-surface"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    )}
  </div>
);
