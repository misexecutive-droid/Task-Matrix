import { Sparkles } from 'lucide-react';
import { Combobox } from '../../../components';
import { LABEL_CLASS } from './formConstants';
import type { Category } from '@/api/categories';

interface CategoryFieldProps {
  categoryId: string | undefined;
  onChange: (id: string) => void;
  categories: Category[] | undefined;
}

// Picking a category auto-fills Department, Assignee, and TAT/due-date below.
export const CategoryField = ({ categoryId, onChange, categories }: CategoryFieldProps) => (
  <div className="flex flex-col gap-2">
    <label className={LABEL_CLASS}>
      <Sparkles className="w-3.5 h-3.5" /> Category
    </label>
    <Combobox
      value={categoryId ?? ''}
      onChange={onChange}
      placeholder="Search categories..."
      emptyOptionLabel="No category"
      options={(categories ?? []).map(c => ({ value: c.id, label: c.name }))}
    />
  </div>
);
