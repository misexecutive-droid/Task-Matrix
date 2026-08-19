import type { ReactNode } from 'react';
import { Camera } from 'lucide-react';
import { UserMultiSelect, AccessoriesListEditor } from '../../../../components';
import { ConditionalLogicPanel } from './ConditionalLogicPanel';
import type { ChecklistItemType } from '../../../../api/checklistDefinitions';
import type { ItemDraft } from '../ChecklistDefinitionItemDraftRow';

export interface ItemTypeFieldsProps {
  draft:    ItemDraft;
  onChange: (patch: Partial<ItemDraft>) => void;
  storeId?: string;
}

const FIELD_LABEL = 'text-[11px] font-display font-semibold text-text-muted';
const MINI_INPUT =
  'px-2 py-1.5 text-xs font-mono text-center bg-surface text-text rounded-md border border-border ' +
  'placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-150';

const PhotoFields = ({ draft, onChange }: ItemTypeFieldsProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border/60">
      <Camera size={13} className="text-text-muted ml-1" />
      <div className="flex items-center gap-1.5">
        <span className={FIELD_LABEL}>Min</span>
        <input
          type="number" min={0} value={draft.requiredImageCount}
          onChange={e => onChange({ requiredImageCount: e.target.value })}
          className={`w-10 ${MINI_INPUT}`}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className={FIELD_LABEL}>Max</span>
        <input
          type="number" min={0} value={draft.maxImageCount}
          onChange={e => onChange({ maxImageCount: e.target.value })}
          placeholder="∞"
          className={`w-10 ${MINI_INPUT}`}
        />
      </div>
    </div>
    <label className="flex items-center gap-2 text-xs font-display text-text-secondary cursor-pointer select-none">
      <input
        type="checkbox" checked={draft.requiresLivePhoto}
        onChange={e => onChange({ requiresLivePhoto: e.target.checked })}
        className="rounded border-border text-primary-600 focus:ring-primary-500/20"
      />
      Live photo only (blocks gallery uploads)
    </label>
  </div>
);

const AuditFields = ({ draft, onChange, storeId }: ItemTypeFieldsProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-display font-semibold text-text-secondary">Who audits this?</span>
      <UserMultiSelect storeId={storeId} selected={draft.auditUserIds} onChange={ids => onChange({ auditUserIds: ids })} />
    </div>
    <AccessoriesListEditor accessories={draft.accessories} onChange={accessories => onChange({ accessories })} />
  </div>
);

const NumberFields = ({ draft, onChange }: ItemTypeFieldsProps) => (
  <div className="flex flex-wrap items-end gap-3">
    <div className="flex flex-col gap-1">
      <span className={FIELD_LABEL}>Unit</span>
      <input
        value={draft.numberEntryUnit} onChange={e => onChange({ numberEntryUnit: e.target.value })}
        placeholder="₹, kg, pcs…" className={`w-20 text-left px-2 ${MINI_INPUT}`}
      />
    </div>
    <div className="flex flex-col gap-1">
      <span className={FIELD_LABEL}>Min</span>
      <input type="number" value={draft.numberEntryMin} onChange={e => onChange({ numberEntryMin: e.target.value })} placeholder="—" className={`w-16 ${MINI_INPUT}`} />
    </div>
    <div className="flex flex-col gap-1">
      <span className={FIELD_LABEL}>Max</span>
      <input type="number" value={draft.numberEntryMax} onChange={e => onChange({ numberEntryMax: e.target.value })} placeholder="—" className={`w-16 ${MINI_INPUT}`} />
    </div>
    {draft.itemType === 'CASH_TALLY' && (
      <div className="flex flex-col gap-1">
        <span className={FIELD_LABEL}>Expected amount</span>
        <input
          type="number" value={draft.cashExpectedAmount} onChange={e => onChange({ cashExpectedAmount: e.target.value })}
          placeholder="Optional" className={`w-24 ${MINI_INPUT}`}
        />
      </div>
    )}
  </div>
);

const RATING_SCALES = ['3', '5', '10'];

const RatingFields = ({ draft, onChange }: ItemTypeFieldsProps) => (
  <div className="flex items-center gap-2">
    <span className={FIELD_LABEL}>Scale out of</span>
    <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
      {RATING_SCALES.map(scale => (
        <button
          key={scale}
          type="button"
          onClick={() => onChange({ ratingScale: scale })}
          className={[
            'px-3 py-1.5 rounded-md text-xs font-display font-semibold transition-all duration-200 cursor-pointer',
            draft.ratingScale === scale ? 'bg-primary-700 text-white shadow-sm' : 'text-text-muted hover:text-text hover:bg-surface-hover',
          ].join(' ')}
        >
          {scale}
        </button>
      ))}
    </div>
  </div>
);

const GpsFields = ({ draft, onChange }: ItemTypeFieldsProps) => (
  <div className="flex flex-col gap-2">
    <p className={FIELD_LABEL}>Pin an exact spot — optional, leave blank to just capture wherever they are</p>
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className={FIELD_LABEL}>Latitude</span>
        <input type="number" step="any" value={draft.gpsTargetLat} onChange={e => onChange({ gpsTargetLat: e.target.value })} placeholder="—" className={`w-24 ${MINI_INPUT}`} />
      </div>
      <div className="flex flex-col gap-1">
        <span className={FIELD_LABEL}>Longitude</span>
        <input type="number" step="any" value={draft.gpsTargetLng} onChange={e => onChange({ gpsTargetLng: e.target.value })} placeholder="—" className={`w-24 ${MINI_INPUT}`} />
      </div>
      <div className="flex flex-col gap-1">
        <span className={FIELD_LABEL}>Radius (m)</span>
        <input type="number" min={1} value={draft.gpsRadiusMeters} onChange={e => onChange({ gpsRadiusMeters: e.target.value })} placeholder="—" className={`w-20 ${MINI_INPUT}`} />
      </div>
    </div>
  </div>
);

const QrFields = ({ draft, onChange }: ItemTypeFieldsProps) => (
  <div className="flex flex-col gap-1.5">
    <span className={FIELD_LABEL}>Expected code (optional — leave blank to accept any scan)</span>
    <input
      value={draft.qrExpectedValue} onChange={e => onChange({ qrExpectedValue: e.target.value })}
      placeholder="e.g. SKU-04821" className={`w-full text-left px-3 py-1.5 ${MINI_INPUT}`}
    />
  </div>
);

const OptionsFields = ({ draft, onChange }: ItemTypeFieldsProps) => (
  <AccessoriesListEditor label="Options" accessories={draft.options} onChange={options => onChange({ options })} />
);

const ConditionalFields = ({ draft, onChange }: ItemTypeFieldsProps) => {
  if (draft.itemType !== 'YES_NO' && draft.itemType !== 'PASS_FAIL') return null;
  return (
    <ConditionalLogicPanel
      itemType={draft.itemType}
      trigger={draft.conditionalTrigger}
      actions={draft.conditionalActions}
      onTriggerChange={trigger => onChange({ conditionalTrigger: trigger })}
      onActionsChange={actions => onChange({ conditionalActions: actions })}
    />
  );
};

const infoNote = (text: string) => () => <p className="text-xs font-display text-text-muted leading-relaxed">{text}</p>;

const VideoFields = (props: ItemTypeFieldsProps) => (
  <div className="flex flex-col gap-2.5">
    <PhotoFields {...props} />
    <p className="text-xs font-display text-text-muted">Accepts a short video clip instead of a photo — Min/Max above apply to clips.</p>
  </div>
);

type FieldRenderer = (props: ItemTypeFieldsProps) => ReactNode;

// Single source of truth for "what does this question type need to be configured?" — shared by
// the item draft row (full editor) and the palette's quick-add popup, so the two never drift.
const FIELDS_BY_TYPE: Partial<Record<ChecklistItemType, FieldRenderer>> = {
  STANDARD: PhotoFields,
  VIDEO_UPLOAD: VideoFields,
  AUDIT: AuditFields,
  NUMBER_ENTRY: NumberFields,
  CASH_TALLY: NumberFields,
  RATING: RatingFields,
  GPS: GpsFields,
  QR_SCAN: QrFields,
  MULTIPLE_CHOICE: OptionsFields,
  DROPDOWN: OptionsFields,
  YES_NO: ConditionalFields,
  PASS_FAIL: ConditionalFields,
  SIGNATURE: infoNote('Captures one signature drawn on-screen.'),
  DUAL_SIGNATURE: infoNote('Captures two signatures drawn on-screen, one after another — e.g. employee then supervisor.'),
};

export const ItemTypeConfigFields = (props: ItemTypeFieldsProps) => {
  const Renderer = FIELDS_BY_TYPE[props.draft.itemType];
  if (!Renderer) {
    return <p className="text-xs font-display text-text-muted italic">No extra setup needed for this type — the label above is enough.</p>;
  }
  return <>{Renderer(props)}</>;
};

// Mirrors ChecklistBuilder's save-time validation, one item at a time — used both to gate the
// quick-add popup's confirm button and (via ChecklistBuilder) the final "Create checklist" submit,
// so an item can never look addable in one place and rejected in the other. Kept alongside
// ItemTypeConfigFields since both operate on the same ItemDraft shape — only affects Fast Refresh
// granularity, not runtime correctness.
// eslint-disable-next-line react-refresh/only-export-components
export const isItemDraftComplete = (draft: ItemDraft): boolean => {
  if (draft.itemType === 'AUDIT' && draft.auditUserIds.length === 0) return false;
  if ((draft.itemType === 'MULTIPLE_CHOICE' || draft.itemType === 'DROPDOWN') && draft.options.length < 2) return false;
  if (draft.itemType === 'GPS' && draft.gpsRadiusMeters.trim() && (!draft.gpsTargetLat.trim() || !draft.gpsTargetLng.trim())) return false;
  return true;
};
