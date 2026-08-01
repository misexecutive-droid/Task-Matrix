import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface AccessoriesListEditorProps {
  label?:       string;
  accessories:  string[];
  onChange:     (accessories: string[]) => void;
}

// Admin-defined list of named, togglable checklist rows (e.g. "Shoes", "Belt", "ID Card") that
// each auditor checks off on their own AUDIT-item submission — see ChecklistDefinitionItemDraftRow.
// Styled like the rest of the shared form components (rounded-none, token classes).
export const AccessoriesListEditor = ({ label = 'Accessories checklist', accessories, onChange }: AccessoriesListEditorProps) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed || accessories.includes(trimmed)) return;
    onChange([...accessories, trimmed]);
    setDraft('');
  };

  const remove = (name: string) => onChange(accessories.filter(a => a !== name));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-display font-medium text-text-secondary">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Shoes, Belt, ID Card"
          className="flex-1 px-3 h-10 text-sm bg-surface text-text rounded-none border border-border placeholder:text-text-light focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-600/15 transition-colors duration-150"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 h-10 text-sm font-display font-medium text-primary-600 border border-primary-600/30 rounded-none hover:bg-primary-600/10 transition-colors"
        >
          Add
        </button>
      </div>
      {accessories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {accessories.map(name => (
            <span
              key={name}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-display text-text bg-surface-hover border border-border rounded-none"
            >
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                className="p-0.5 rounded-full hover:bg-surface hover:text-danger text-text-muted transition-colors"
                aria-label={`Remove ${name}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
