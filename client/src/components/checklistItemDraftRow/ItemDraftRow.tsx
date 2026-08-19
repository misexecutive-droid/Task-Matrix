import {
  Check,
  Calendar,
  User,
  Image as ImageIcon,
  Camera,
  Trash2,
} from 'lucide-react';

export type ChecklistItemDraft = {
  id:                 string;
  label:              string;
  assigneeId:         string;
  dueAt:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
};

// Tightly coupled to ChecklistItemDraft/ChecklistItemDraftRow right below — only affects Fast
// Refresh granularity, not runtime correctness.
// eslint-disable-next-line react-refresh/only-export-components
export const emptyChecklistItemDraft = (): ChecklistItemDraft => ({
  id: crypto.randomUUID(),
  label: '', assigneeId: '', dueAt: '', requiredImageCount: '0', maxImageCount: '', requiresLivePhoto: false,
});

interface AssignableUserLike {
  id:        string;
  firstName: string;
  lastName?: string | null;
}

interface ChecklistItemDraftRowProps {
  index:                   number;
  draft:                   ChecklistItemDraft;
  assignableUsers?:        AssignableUserLike[];
  canRemove:               boolean;
  onChange:                (patch: Partial<ChecklistItemDraft>) => void;
  onRemove:                () => void;
  /** Templates don't carry a due date — hide the field entirely rather than showing a dead input. */
  showDueDate?:            boolean;
  /** Set (to an explanatory placeholder) when the assignable list depends on a not-yet-chosen
   *  department — disables the select instead of showing an empty, seemingly-broken dropdown. */
  assigneeDisabledReason?: string;
}

// Shared by the delegation checklist builder (NewChecklistForm) and the admin checklist template
// builder (ChecklistTemplateFormUI) — both were drafting the same shape (label + assignee + photo
// requirements) through two separately-styled, separately-maintained components before this.
export const ChecklistItemDraftRow = ({
  index, draft, assignableUsers, canRemove, onChange, onRemove, showDueDate = true, assigneeDisabledReason,
}: ChecklistItemDraftRowProps) => {
  const assigneeDisabled = !!assigneeDisabledReason;

  return (
    <div className="group relative flex flex-col gap-4 p-4 sm:p-5 bg-surface rounded-xl border border-border shadow-xs transition-all duration-200 hover:shadow-sm hover:border-border-hover">

      {/* Step number + label input + remove */}
      <div className="flex items-start gap-3 w-full">
        <div className="flex shrink-0 items-center justify-center w-7 h-7 mt-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold select-none">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <label className="sr-only">Step description</label>
          <input
            value={draft.label}
            onChange={e => onChange({ label: e.target.value })}
            placeholder="e.g., Audit frontend performance metrics..."
            className="w-full bg-transparent text-text placeholder:text-text-light text-lg font-medium outline-none border-b border-transparent focus:border-primary-500 focus:ring-0 transition-colors pb-1"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-danger/30 cursor-pointer"
            aria-label="Remove step"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Configuration Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showDueDate ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 pl-0 sm:pl-10`}>

        {/* Assignee */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <User size={14} /> Assignee
          </label>
          <select
            value={draft.assigneeId}
            onChange={e => onChange({ assigneeId: e.target.value })}
            disabled={assigneeDisabled}
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">{assigneeDisabledReason ?? 'Unassigned'}</option>
            {assignableUsers?.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</option>
            ))}
          </select>
        </div>

        {/* Due Date — only meaningful when this draft belongs to a real delegation, not a template */}
        {showDueDate && (
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <Calendar size={14} /> Due Date
            </label>
            <input
              type="date"
              value={draft.dueAt}
              onChange={e => onChange({ dueAt: e.target.value })}
              className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        )}

        {/* Min Photos */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <ImageIcon size={14} /> Min Photos
          </label>
          <input
            type="number" min={0}
            value={draft.requiredImageCount}
            onChange={e => onChange({ requiredImageCount: e.target.value })}
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
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
            onChange={e => onChange({ maxImageCount: e.target.value })}
            placeholder="No limit"
            className="w-full px-3 py-2 text-sm text-text-secondary bg-surface-hover rounded-lg border border-border placeholder:text-text-light focus:bg-surface focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Live-photo toggle */}
      <div className="flex items-center justify-between pl-0 sm:pl-10 mt-2 pt-4 border-t border-border/60">
        <label className="group/toggle flex items-center gap-3 cursor-pointer">
          <div className="relative flex items-center justify-center w-5 h-5">
            {/* sr-only (not hidden) so keyboard users can still tab to it */}
            <input
              type="checkbox"
              className="sr-only peer"
              checked={draft.requiresLivePhoto}
              onChange={e => onChange({ requiresLivePhoto: e.target.checked })}
            />
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 ${
              draft.requiresLivePhoto
                ? 'bg-primary-600 border-primary-600'
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
