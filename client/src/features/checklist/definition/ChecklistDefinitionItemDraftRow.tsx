import { Camera } from 'lucide-react';
import { UserMultiSelect, AccessoriesListEditor } from '../../../components';
import { ConditionalLogicPanel } from './builder/ConditionalLogicPanel';
import type { ChecklistItemType, ChecklistConditionalAction } from '../../../api/checklistDefinitions';

export type ItemDraft = {
  label:              string;
  requiredImageCount: string;
  maxImageCount:      string;
  requiresLivePhoto:  boolean;
  itemType:           ChecklistItemType;
  auditUserIds:       string[];
  accessories:        string[];
  numberEntryUnit:    string;
  numberEntryMin:     string;
  numberEntryMax:     string;
  ratingScale:        string;
  options:            string[];
  gpsTargetLat:       string;
  gpsTargetLng:       string;
  gpsRadiusMeters:    string;
  qrExpectedValue:    string;
  cashExpectedAmount: string;
  conditionalTrigger: 'YES' | 'NO' | '';
  conditionalActions: ChecklistConditionalAction[];
};

export const emptyItemDraft = (): ItemDraft => ({
  label: '',
  requiredImageCount: '0',
  maxImageCount: '',
  requiresLivePhoto: false,
  itemType: 'STANDARD',
  auditUserIds: [],
  accessories: [],
  numberEntryUnit: '',
  numberEntryMin: '',
  numberEntryMax: '',
  ratingScale: '5',
  options: [],
  gpsTargetLat: '',
  gpsTargetLng: '',
  gpsRadiusMeters: '',
  qrExpectedValue: '',
  cashExpectedAmount: '',
  conditionalTrigger: '',
  conditionalActions: [],
});

const ITEM_TYPE_LABEL: Record<ChecklistItemType, string> = {
  STANDARD: 'Standard',
  AUDIT: 'Audit',
  NUMBER_ENTRY: 'Number entry',
  RATING: 'Rating',
  YES_NO: 'Yes / No',
  PASS_FAIL: 'Pass / Fail',
  MULTIPLE_CHOICE: 'Multiple choice',
  DROPDOWN: 'Dropdown',
  TEXT_BOX: 'Text box',
  DATE_TIME: 'Date & time',
  GPS: 'GPS location',
  SIGNATURE: 'Signature',
  DUAL_SIGNATURE: 'Dual signature',
  QR_SCAN: 'QR / Barcode scan',
  CASH_TALLY: 'Cash tally',
  VIDEO_UPLOAD: 'Video upload',
};

const OPTION_BASED_TYPES: ChecklistItemType[] = ['MULTIPLE_CHOICE', 'DROPDOWN'];

interface ChecklistDefinitionItemDraftRowProps {
  index:    number;
  draft:    ItemDraft;
  onChange: (index: number, patch: Partial<ItemDraft>) => void;
  storeId?: string;
}

// Sibling of admin/checklist/ItemDraftRow.tsx — same photo-requirement controls (min/max count,
// live-photo-only), minus the per-item assignee dropdown, since assignment here lives at the
// checklist level via assigneeIds, not per-item — EXCEPT for itemType "AUDIT", which is the one
// deliberate exception: it names specific users (auditUserIds) who must each independently submit
// their own evidence against this one step (see ChecklistInstanceItemSubmission on the backend).
export const ChecklistDefinitionItemDraftRow = ({ index, draft, onChange, storeId }: ChecklistDefinitionItemDraftRowProps) => (
  <div className="flex flex-col gap-2 p-3 rounded-lg border border-border/70 bg-surface">
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center size-6 rounded-md bg-surface-hover text-text-muted text-[11px] font-display font-bold shrink-0 tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <input
        value={draft.label}
        onChange={e => onChange(index, { label: e.target.value })}
        placeholder={`Item ${index + 1} description...`}
        className="flex-1 min-w-0 px-3 py-2.5 text-sm font-display bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
      />
    </div>

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

      <div className="flex items-center flex-wrap rounded-lg border border-border/60 bg-background p-0.5 text-xs font-display">
        {([
          'STANDARD', 'AUDIT', 'NUMBER_ENTRY', 'RATING',
          'YES_NO', 'PASS_FAIL', 'MULTIPLE_CHOICE', 'DROPDOWN', 'TEXT_BOX', 'DATE_TIME',
          'GPS', 'SIGNATURE', 'DUAL_SIGNATURE', 'QR_SCAN', 'CASH_TALLY', 'VIDEO_UPLOAD',
        ] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(index, { itemType: type })}
            className={[
              'px-2.5 py-1 rounded-md transition-colors whitespace-nowrap',
              draft.itemType === type ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text',
            ].join(' ')}
          >
            {ITEM_TYPE_LABEL[type]}
          </button>
        ))}
      </div>
    </div>

    {draft.itemType === 'AUDIT' && (
      <div className="flex flex-col gap-3 mt-1 pt-3 border-t border-dashed border-border/60">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-display font-medium text-text-secondary">Auditors</span>
          <UserMultiSelect
            storeId={storeId}
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

    {(draft.itemType === 'NUMBER_ENTRY' || draft.itemType === 'CASH_TALLY') && (
      <div className="flex flex-wrap items-center gap-3 mt-1 pt-3 border-t border-dashed border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-display text-text-muted">Unit:</span>
          <input
            value={draft.numberEntryUnit}
            onChange={e => onChange(index, { numberEntryUnit: e.target.value })}
            placeholder="₹, kg, pcs…"
            className="w-20 px-2 py-1 text-xs font-display bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-display text-text-muted">Min:</span>
          <input
            type="number"
            value={draft.numberEntryMin}
            onChange={e => onChange(index, { numberEntryMin: e.target.value })}
            placeholder="—"
            className="w-16 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border placeholder:text-text-muted"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-display text-text-muted">Max:</span>
          <input
            type="number"
            value={draft.numberEntryMax}
            onChange={e => onChange(index, { numberEntryMax: e.target.value })}
            placeholder="—"
            className="w-16 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border placeholder:text-text-muted"
          />
        </div>
        {draft.itemType === 'CASH_TALLY' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-display text-text-muted">Expected amount (optional):</span>
            <input
              type="number"
              value={draft.cashExpectedAmount}
              onChange={e => onChange(index, { cashExpectedAmount: e.target.value })}
              placeholder="—"
              className="w-20 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border placeholder:text-text-muted"
            />
          </div>
        )}
      </div>
    )}

    {draft.itemType === 'GPS' && (
      <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t border-dashed border-border/60">
        <span className="text-[11px] font-display text-text-muted">Require a specific location (optional — leave blank to just capture wherever they are):</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-display text-text-muted">Lat:</span>
            <input
              type="number"
              step="any"
              value={draft.gpsTargetLat}
              onChange={e => onChange(index, { gpsTargetLat: e.target.value })}
              placeholder="—"
              className="w-24 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border placeholder:text-text-muted"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-display text-text-muted">Lng:</span>
            <input
              type="number"
              step="any"
              value={draft.gpsTargetLng}
              onChange={e => onChange(index, { gpsTargetLng: e.target.value })}
              placeholder="—"
              className="w-24 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border placeholder:text-text-muted"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-display text-text-muted">Radius (m):</span>
            <input
              type="number"
              min={1}
              value={draft.gpsRadiusMeters}
              onChange={e => onChange(index, { gpsRadiusMeters: e.target.value })}
              placeholder="—"
              className="w-16 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border placeholder:text-text-muted"
            />
          </div>
        </div>
      </div>
    )}

    {draft.itemType === 'QR_SCAN' && (
      <div className="flex items-center gap-1.5 mt-1 pt-3 border-t border-dashed border-border/60">
        <span className="text-[11px] font-display text-text-muted shrink-0">Expected code (optional):</span>
        <input
          value={draft.qrExpectedValue}
          onChange={e => onChange(index, { qrExpectedValue: e.target.value })}
          placeholder="Leave blank to accept any scan"
          className="flex-1 min-w-0 px-2 py-1 text-xs font-mono bg-surface text-text rounded-md border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        />
      </div>
    )}

    {(draft.itemType === 'SIGNATURE' || draft.itemType === 'DUAL_SIGNATURE') && (
      <p className="text-[11px] font-display text-text-muted mt-1 pt-3 border-t border-dashed border-border/60">
        {draft.itemType === 'SIGNATURE'
          ? 'Captures one signature drawn on-screen.'
          : 'Captures two signatures drawn on-screen, one after the other (e.g. employee + supervisor).'}
      </p>
    )}

    {draft.itemType === 'VIDEO_UPLOAD' && (
      <p className="text-[11px] font-display text-text-muted mt-1 pt-3 border-t border-dashed border-border/60">
        Accepts a short video clip instead of a photo — the Min/Max counts above apply to video clips.
      </p>
    )}

    {(draft.itemType === 'YES_NO' || draft.itemType === 'PASS_FAIL') && (
      <div className="mt-1 pt-3 border-t border-dashed border-border/60">
        <ConditionalLogicPanel
          itemType={draft.itemType}
          trigger={draft.conditionalTrigger}
          actions={draft.conditionalActions}
          onTriggerChange={trigger => onChange(index, { conditionalTrigger: trigger })}
          onActionsChange={actions => onChange(index, { conditionalActions: actions })}
        />
      </div>
    )}

    {draft.itemType === 'RATING' && (
      <div className="flex items-center gap-1.5 mt-1 pt-3 border-t border-dashed border-border/60">
        <span className="text-[11px] font-display text-text-muted">Scale (out of):</span>
        <input
          type="number"
          min={2}
          max={10}
          value={draft.ratingScale}
          onChange={e => onChange(index, { ratingScale: e.target.value })}
          className="w-14 px-1.5 py-1 text-xs font-mono text-center bg-surface text-text rounded-md border border-border"
        />
      </div>
    )}

    {OPTION_BASED_TYPES.includes(draft.itemType) && (
      <div className="mt-1 pt-3 border-t border-dashed border-border/60">
        <AccessoriesListEditor
          label="Options"
          accessories={draft.options}
          onChange={options => onChange(index, { options })}
        />
      </div>
    )}
  </div>
);
