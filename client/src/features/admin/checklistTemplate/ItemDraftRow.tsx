import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  Camera, 
  UserCheck, 
  Image as ImageIcon,
  Lock,
  ChevronDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AssignableUser } from '../../../api/users';

/** Utility for intelligent Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
export type ItemDraft = {
  id: string;
  label: string;
  requiredImageCount: string;
  maxImageCount: string;
  requiresLivePhoto: boolean;
  assigneeId: string;
};

export const emptyItemDraft = (): ItemDraft => ({
  id: crypto.randomUUID(),
  label: '',
  requiredImageCount: '0',
  maxImageCount: '',
  requiresLivePhoto: false,
  assigneeId: '',
});

interface ItemDraftRowProps {
  draft: ItemDraft;
  index: number;
  departmentId: string;
  assignableUsers?: AssignableUser[];
  canRemove: boolean;
  onChange: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
}

const UNASSIGNED = '__unassigned__';

// --- Component ---
export const ItemDraftRow = ({ 
  draft, 
  index, 
  departmentId, 
  assignableUsers, 
  canRemove, 
  onChange, 
  onRemove 
}: ItemDraftRowProps) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col gap-4 p-4 sm:p-5",
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm",
        "transition-all duration-300 ease-in-out hover:shadow-md",
        "focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10"
      )}
    >
      {/* Header & Primary Input Row */}
      <header className="flex items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold select-none mt-1 sm:mt-0">
          {index + 1}
        </div>
        
        <input
          type="text"
          value={draft.label}
          onChange={e => onChange({ label: e.target.value })}
          placeholder={`Step ${index + 1} description…`}
          className={cn(
            "flex-1 w-full bg-transparent border-0 p-0 py-1.5",
            "text-base sm:text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400",
            "focus:ring-0 focus:outline-none transition-colors"
          )}
        />
        
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove step"
            className={cn(
              "shrink-0 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl",
              "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 mt-1 sm:mt-0"
            )}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Configuration Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
        
        {/* Photo Validation Settings */}
        <div className="sm:col-span-7 flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="px-2 text-slate-400 border-r border-slate-200 dark:border-slate-800">
              <ImageIcon className="w-4 h-4" />
            </div>
            
            <label className="flex items-center gap-1.5 px-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Min</span>
              <input
                type="number"
                min={0}
                value={draft.requiredImageCount}
                onChange={e => onChange({ requiredImageCount: e.target.value })}
                className="w-12 h-7 px-2 text-sm font-semibold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
              />
            </label>

            <label className="flex items-center gap-1.5 pr-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max</span>
              <input
                type="number"
                min={0}
                value={draft.maxImageCount}
                onChange={e => onChange({ maxImageCount: e.target.value })}
                placeholder="∞"
                className="w-12 h-7 px-2 text-sm font-semibold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 text-slate-900 dark:text-white transition-all"
              />
            </label>
          </div>

          <label className={cn(
            "flex items-center gap-2 text-sm font-medium cursor-pointer select-none transition-colors",
            Number(draft.requiredImageCount) > 0 
              ? "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" 
              : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
          )}>
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={draft.requiresLivePhoto}
                disabled={Number(draft.requiredImageCount) === 0}
                onChange={e => onChange({ requiresLivePhoto: e.target.checked })}
                className="peer w-5 h-5 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-600/20 focus:ring-offset-0 bg-transparent disabled:opacity-50 transition-all cursor-pointer"
              />
              <Camera className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            Live photo only
          </label>
        </div>

        {/* Assignee Select */}
        <div className="sm:col-span-5 flex flex-col gap-1.5 relative">
          <div className="relative group/select">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">
              {!departmentId ? <Lock className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            
            <select
              value={draft.assigneeId || UNASSIGNED}
              onChange={e => onChange({ assigneeId: e.target.value === UNASSIGNED ? '' : e.target.value })}
              disabled={!departmentId}
              className={cn(
                "w-full h-10 pl-10 pr-10 text-sm font-medium appearance-none transition-all",
                "bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none",
                !departmentId 
                  ? "border-slate-100 dark:border-slate-800/50 text-slate-400 cursor-not-allowed" 
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              )}
            >
              <option value={UNASSIGNED}>
                {!departmentId ? 'Select department first' : 'Unassigned (Anyone)'}
              </option>
              {assignableUsers?.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName ?? ''}
                </option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover/select:text-slate-600 dark:group-hover/select:text-slate-300">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>
    </motion.article>
  );
};