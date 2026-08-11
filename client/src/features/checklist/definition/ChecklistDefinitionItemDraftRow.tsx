import { ItemTypeConfigFields } from './builder/ItemTypeConfigFields';
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

export const ITEM_TYPE_LABEL: Record<ChecklistItemType, string> = {
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

const ITEM_TYPES = [
  'STANDARD', 'AUDIT', 'NUMBER_ENTRY', 'RATING',
  'YES_NO', 'PASS_FAIL', 'MULTIPLE_CHOICE', 'DROPDOWN', 'TEXT_BOX', 'DATE_TIME',
  'GPS', 'SIGNATURE', 'DUAL_SIGNATURE', 'QR_SCAN', 'CASH_TALLY', 'VIDEO_UPLOAD',
] as const satisfies readonly ChecklistItemType[];

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
// Per-type fields live in ItemTypeConfigFields, shared with the palette's quick-add popup so both
// surfaces agree on what each question type needs.
export const ChecklistDefinitionItemDraftRow = ({ index, draft, onChange, storeId }: ChecklistDefinitionItemDraftRowProps) => {
  const patch = (p: Partial<ItemDraft>) => onChange(index, p);

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-border/70 bg-surface transition-colors duration-200 hover:border-border/90 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center size-6 rounded-md bg-surface-hover text-text-muted text-[11px] font-display font-bold shrink-0 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <input
          value={draft.label}
          onChange={e => patch({ label: e.target.value })}
          placeholder={`Item ${index + 1} description...`}
          className="flex-1 min-w-0 px-3 py-2.5 text-sm font-display bg-surface text-text rounded-lg border border-border placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-150"
        />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/60 bg-background p-1 text-xs font-display">
        {ITEM_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => patch({ itemType: type })}
            className={[
              'shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium transition-all duration-150 cursor-pointer',
              draft.itemType === type ? 'bg-primary-700 text-white shadow-sm' : 'text-text-muted hover:text-text hover:bg-surface-hover',
            ].join(' ')}
          >
            {ITEM_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      <div className="pt-2.5 border-t border-dashed border-border/60">
        <ItemTypeConfigFields draft={draft} onChange={patch} storeId={storeId} />
      </div>
    </div>
  );
};
