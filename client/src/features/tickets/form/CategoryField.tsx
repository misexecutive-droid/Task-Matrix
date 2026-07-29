import { Sparkles } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LABEL_CLASS, SELECT_CLASS, NO_CATEGORY } from './formConstants';
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
    <Select
      value={categoryId || NO_CATEGORY}
      onValueChange={v => onChange(v === NO_CATEGORY ? '' : v)}
    >
      <SelectTrigger className={SELECT_CLASS}>
        <SelectValue placeholder="No category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CATEGORY} className="font-display text-xs">No category</SelectItem>
        {categories?.map(c => (
          <SelectItem key={c.id} value={c.id} className="font-display text-xs">{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
