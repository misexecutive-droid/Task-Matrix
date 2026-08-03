import { 
  Check, 
  Calendar, 
  User, 
  Image as ImageIcon, 
  Camera, 
  GripVertical,
  Trash2
} from 'lucide-react';

export type ItemDraft = {
  label:              string;
  assigneeId:         string;
  dueAt:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
};

export const emptyItemDraft = (): ItemDraft => ({
  label: '', assigneeId: '', dueAt: '', requiredImageCount: '0', maxImageCount: '', requiresLivePhoto: false,
});

interface AssignableUser {
  id:        string;
  firstName: string;
  lastName?: string | null;
}

interface ItemDraftRowProps {
  index:           number;
  draft:           ItemDraft;
  assignableUsers?: AssignableUser[];
  onChange:        (index: number, patch: Partial<ItemDraft>) => void;
  onRemove?:       (index: number) => void; // Added for list management
}

export const ItemDraftRow = ({ index, draft, assignableUsers, onChange, onRemove }: ItemDraftRowProps) => {
  return (
    <div className="group relative flex flex-col gap-4 p-4 sm:p-5 bg-surface rounded-xl border border-border shadow-xs transition-all duration-200 hover:shadow-sm hover:border-border-hover">

      {/* Drag Handle / Delete Button Area — delete stays visible on touch, reveal-on-hover on pointer devices */}
      <div className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-danger/30 cursor-pointer"
            aria-label="Remove task"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Main Task Input */}
      <div className="flex items-start gap-3 w-full pr-8">
        <div className="mt-2.5 text-text-light cursor-grab active:cursor-grabbing hidden sm:block">
          <GripVertical size={18} />
        </div>
        <div className="flex-1">
          <label className="sr-only">Task Description</label>
          <input
            value={draft.label}
            onChange={e => onChange(index, { label: e.target.value })}
            placeholder="e.g., Audit frontend performance metrics..."
            className="w-full bg-transparent text-text placeholder:text-text-light text-lg font-medium outline-none border-b border-transparent focus:border-blue-500 focus:ring-0 transition-colors pb-1"
          />
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-0 sm:pl-8">

        {/* Assignee */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <User size={14} /> Assignee
          </label>
          <select
            value={draft.assigneeId}
            onChange={e => onChange(index, { assigneeId: e.target.value })}
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">Unassigned</option>
            {assignableUsers?.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <Calendar size={14} /> Due Date
          </label>
          <input
            type="date"
            value={draft.dueAt}
            onChange={e => onChange(index, { dueAt: e.target.value })}
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Min Photos */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <ImageIcon size={14} /> Min Photos
          </label>
          <input
            type="number" min={0}
            value={draft.requiredImageCount}
            onChange={e => onChange(index, { requiredImageCount: e.target.value })}
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Max Photos */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <ImageIcon size={14} /> Max Photos
          </label>
          <input
            type="number" min={0}
            value={draft.maxImageCount}
            onChange={e => onChange(index, { maxImageCount: e.target.value })}
            placeholder="No limit"
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border placeholder:text-text-light focus:bg-surface focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Toggles & Actions */}
      <div className="flex items-center justify-between pl-0 sm:pl-8 mt-2 pt-4 border-t border-border/60">
        <label className="group/toggle flex items-center gap-3 cursor-pointer">
          <div className="relative flex items-center justify-center w-5 h-5">
            {/* sr-only (not hidden) so keyboard users can still tab to it */}
            <input
              type="checkbox"
              className="sr-only peer"
              checked={draft.requiresLivePhoto}
              onChange={e => onChange(index, { requiresLivePhoto: e.target.checked })}
            />
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${
              draft.requiresLivePhoto
                ? 'bg-blue-600 border-blue-600'
                : 'bg-surface border-border-hover group-hover/toggle:border-text-light'
            }`}>
              {draft.requiresLivePhoto && <Check size={14} strokeWidth={3} className="text-white" />}
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-text-secondary group-hover/toggle:text-text transition-colors">
            <Camera size={16} className="text-text-light" />
            Requires live camera capture
          </span>
        </label>
      </div>

    </div>
  );
};