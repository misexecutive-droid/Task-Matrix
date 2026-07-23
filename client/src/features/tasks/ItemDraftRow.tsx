import { CheckSquare } from 'lucide-react';

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
  id:         string;
  firstName:  string;
  lastName?:  string | null;
}

interface ItemDraftRowProps {
  index:           number;
  draft:           ItemDraft;
  assignableUsers?: AssignableUser[];
  onChange:        (index: number, patch: Partial<ItemDraft>) => void;
}

export const ItemDraftRow = ({ index, draft, assignableUsers, onChange }: ItemDraftRowProps) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-hover/50 rounded-lg border border-border">
      <input
        value={draft.label}
        onChange={e => onChange(index, { label: e.target.value })}
        placeholder={`Task ${index + 1} description...`}
        className="w-full px-3 py-2 text-sm bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Assignee</label>
          <select
            value={draft.assigneeId}
            onChange={e => onChange(index, { assigneeId: e.target.value })}
            className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border"
          >
            <option value="">Unassigned</option>
            {assignableUsers?.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ''}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Due Date</label>
          <input
            type="date"
            value={draft.dueAt}
            onChange={e => onChange(index, { dueAt: e.target.value })}
            className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Min Photos</label>
          <input
            type="number" min={0}
            value={draft.requiredImageCount}
            onChange={e => onChange(index, { requiredImageCount: e.target.value })}
            className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Max Photos</label>
          <input
            type="number" min={0}
            value={draft.maxImageCount}
            onChange={e => onChange(index, { maxImageCount: e.target.value })}
            placeholder="Optional"
            className="px-2 py-1.5 text-sm bg-surface text-text rounded-md border border-border placeholder:text-text-light"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text transition-colors">
          <div className={`flex items-center justify-center size-4 rounded border ${draft.requiresLivePhoto ? 'bg-primary-500 border-primary-500' : 'bg-surface border-border'}`}>
             {draft.requiresLivePhoto && <CheckSquare size={12} className="text-white" />}
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={draft.requiresLivePhoto}
            onChange={e => onChange(index, { requiresLivePhoto: e.target.checked })}
          />
          Requires live camera capture
        </label>
      </div>
    </div>
  );
};
