import { useRef } from 'react';
import {
  Check,
  UserCheck,
  Trash2,
  Image as ImageIcon,
  Lock,
  ChevronDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUpdateChecklistTemplateItemMutation, useDeleteChecklistTemplateItemMutation } from '../hook';
import type { ChecklistTemplateItem } from '../../../api/checklistTemplates';
import type { AssignableUser } from '../../../api/users';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UNASSIGNED = '__unassigned__';

interface ItemRowProps {
  item: ChecklistTemplateItem;
  departmentId: string | null;
  assignableUsers?: AssignableUser[];
  index: number;
}

// --- Main Component ---
export const ItemRow = ({ item, departmentId, assignableUsers, index }: ItemRowProps) => {
  const updateItem = useUpdateChecklistTemplateItemMutation();
  const deleteItem = useDeleteChecklistTemplateItemMutation();
  
  // Refs to track previous values for onBlur checks
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  const handleMinBlur = () => {
    if (!minRef.current) return;
    const value = Number(minRef.current.value) || 0;
    if (value !== item.requiredImageCount) {
      updateItem.mutate({ id: item.id, payload: { requiredImageCount: value } });
    }
  };

  const handleMaxBlur = () => {
    if (!maxRef.current) return;
    const value = maxRef.current.value ? Number(maxRef.current.value) : null;
    if (value !== item.maxImageCount) {
      updateItem.mutate({ id: item.id, payload: { maxImageCount: value } });
    }
  };

  return (
    <article 
      className={cn(
        "group flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5",
        "bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0",
        "transition-colors duration-300 ease-in-out hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
      )}
    >
      {/* Step Index & Label */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold shrink-0 mt-0.5 sm:mt-0 select-none">
          {index + 1}
        </span>
        <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-snug truncate whitespace-normal sm:whitespace-nowrap">
          {item.label}
        </span>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto shrink-0">
        
        {/* Photo Requirements Group */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50">
          <div className="px-1.5 text-slate-400 border-r border-slate-200 dark:border-slate-800">
            <ImageIcon className="w-4 h-4" />
          </div>
          
          <label className="flex items-center gap-1.5 px-1" title="Minimum photos required">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Min</span>
            <input
              ref={minRef}
              type="number"
              min={0}
              defaultValue={item.requiredImageCount}
              onBlur={handleMinBlur}
              className={cn(
                "w-10 h-7 px-1 text-xs font-semibold text-center transition-all",
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              )}
            />
          </label>

          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>

          <label className="flex items-center gap-1.5 pr-1.5" title="Maximum photos allowed">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max</span>
            <input
              ref={maxRef}
              type="number"
              min={0}
              defaultValue={item.maxImageCount ?? ''}
              placeholder="∞"
              onBlur={handleMaxBlur}
              className={cn(
                "w-10 h-7 px-1 text-xs font-semibold text-center transition-all",
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              )}
            />
          </label>
        </div>

        {/* Live Photo Toggle */}
        <button
          type="button"
          onClick={() => updateItem.mutate({ id: item.id, payload: { requiresLivePhoto: !item.requiresLivePhoto } })}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            item.requiresLivePhoto
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400"
              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-3.5 h-3.5 rounded-[4px] transition-colors",
            item.requiresLivePhoto 
              ? "bg-indigo-600 text-white dark:bg-indigo-500" 
              : "border border-slate-300 dark:border-slate-600"
          )}>
            {item.requiresLivePhoto && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
          </div>
          Live only
        </button>

        {/* Assignee Selector */}
        <div className="relative group/select">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">
            {!departmentId ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </div>
          
          <select
            value={item.defaultAssigneeId ?? UNASSIGNED}
            onChange={e => updateItem.mutate({ id: item.id, payload: { defaultAssigneeId: e.target.value === UNASSIGNED ? null : e.target.value } })}
            disabled={!departmentId}
            title={departmentId ? 'Default assignee' : 'Set a department on this template first'}
            className={cn(
              "h-9 pl-8 pr-8 text-xs font-semibold appearance-none transition-all outline-none min-w-[130px]",
              "bg-slate-50 dark:bg-slate-950 border rounded-xl",
              !departmentId 
                ? "border-slate-100 dark:border-slate-800/50 text-slate-400 cursor-not-allowed" 
                : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            )}
          >
            <option value={UNASSIGNED}>Unassigned</option>
            {assignableUsers?.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName ?? ''}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400 group-hover/select:text-slate-600 dark:group-hover/select:text-slate-300">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => deleteItem.mutate(item.id)}
          disabled={deleteItem.isPending}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
            "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
          aria-label="Delete item"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>
    </article>
  );
};