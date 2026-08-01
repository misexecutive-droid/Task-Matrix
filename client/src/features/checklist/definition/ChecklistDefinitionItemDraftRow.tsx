import { Camera } from 'lucide-react';
import { UserMultiSelect, AccessoriesListEditor } from '../../../components';
import type { ChecklistItemType } from '../../../api/checklistDefinitions';

export type ItemDraft = {
  label:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
  itemType:           ChecklistItemType;
  auditUserIds:       string[];
  accessories:        string[];
};

export const emptyItemDraft = (): ItemDraft => ({
  label: '',
  requiredImageCount: '0',
  maxImageCount: '',
  requiresLivePhoto: false,
  itemType: 'STANDARD',
  auditUserIds: [],
  accessories: [],
});

interface ChecklistDefinitionItemDraftRowProps {
  index:        number;
  draft:        ItemDraft;
  onChange:     (index: number, patch: Partial<ItemDraft>) => void;
  departmentId?: string;
}

// Sibling of admin/checklist/ItemDraftRow.tsx — same photo-requirement controls (min/max count,
// live-photo-only), minus the per-item assignee dropdown, since assignment here lives at the
// checklist level via assigneeIds, not per-item — EXCEPT for itemType "AUDIT", which is the one
// deliberate exception: it names specific users (auditUserIds) who must each independently submit
// their own evidence against this one step (see ChecklistInstanceItemSubmission on the backend).
export const ChecklistDefinitionItemDraftRow = ({ index, draft, onChange, departmentId }: ChecklistDefinitionItemDraftRowProps) => (
  <div className="flex flex-col gap-2 p-3 rounded-lg border border-border/70 bg-surface">
    <input
      value={draft.label}
      onChange={e => onChange(index, { label: e.target.value })}
      placeholder={`Item ${index + 1} description...`}
      className="w-full px-3 py-2.5 text-sm font-display bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
    />

    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border/60">
        <Camera size={13} className="text-text-muted ml-1" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-display text-text-muted">Min:</span>
          <input
            type="number"
            min={0}
            value={draft.requiredImageCount}
            onChange={e => onChange(index, { requiredImageCount: e.target.value })}
            className="w-10 px-1.5 py-0.5 text-xs font-mono text-center bg-surface text-text rounded border border-border"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-display text-text-muted">Max:</span>
          <input
            type="number"
            min={0}
            value={draft.maxImageCount}
            onChange={e => onChange(index, { maxImageCount: e.target.value })}
            placeholder="∞"
            className="w-10 px-1.5 py-0.5 text-xs font-mono text-center bg-surface text-text rounded border border-border placeholder:text-text-muted"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-display text-text-secondary cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draft.requiresLivePhoto}
          onChange={e => onChange(index, { requiresLivePhoto: e.target.checked })}
          className="rounded border-border text-primary-500 focus:ring-primary-500/20"
        />
        <span>Live photo only</span>
      </label>

      <div className="flex items-center rounded-lg border border-border/60 bg-background p-0.5 text-xs font-display">
        {(['STANDARD', 'AUDIT'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(index, { itemType: type })}
            className={[
              'px-2.5 py-1 rounded-md transition-colors',
              draft.itemType === type ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text',
            ].join(' ')}
          >
            {type === 'STANDARD' ? 'Standard' : 'Audit'}
          </button>
        ))}
      </div>
    </div>

    {draft.itemType === 'AUDIT' && (
      <div className="flex flex-col gap-3 mt-1 pt-3 border-t border-dashed border-border/60">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-display font-medium text-text-secondary">Auditors</span>
          <UserMultiSelect
            departmentId={departmentId}
            selected={draft.auditUserIds}
            onChange={ids => onChange(index, { auditUserIds: ids })}
          />
        </div>
        <AccessoriesListEditor
          accessories={draft.accessories}
          onChange={accessories => onChange(index, { accessories })}
        />
      </div>
    )}
  </div>
);
