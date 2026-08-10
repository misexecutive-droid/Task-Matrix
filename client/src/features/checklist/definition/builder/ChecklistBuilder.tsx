import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { Button, Skeleton } from '../../../../components';
import {
  useChecklistDefinitionQuery,
  useCreateChecklistDefinitionMutation,
  useUpdateChecklistDefinitionMutation,
} from '../../hook';
import { ChecklistDetailsFields } from '../form/ChecklistDetailsFields';
import { ImportFromTemplateField } from '../form/ImportFromTemplateField';
import { useChecklistTemplatesQuery } from '../../hook';
import { QuestionTypePalette } from './QuestionTypePalette';
import { BuilderSchedulePanel } from './BuilderSchedulePanel';
import { BuilderAssignPanel } from './BuilderAssignPanel';
import { BuilderProofPanel } from './BuilderProofPanel';
import { ChecklistDefinitionItemDraftRow, emptyItemDraft, type ItemDraft } from '../ChecklistDefinitionItemDraftRow';
import type {
  ChecklistRecurrence, ChecklistAssigneeRole, ChecklistProofType,
  ChecklistDefinitionItem, CreateChecklistDefinitionItemPayload,
} from '../../../../api/checklistDefinitions';

const toItemDraft = (item: ChecklistDefinitionItem): ItemDraft => ({
  label: item.label,
  requiredImageCount: String(item.requiredImageCount),
  maxImageCount: item.maxImageCount != null ? String(item.maxImageCount) : '',
  requiresLivePhoto: item.requiresLivePhoto,
  itemType: item.itemType,
  auditUserIds: item.auditUserIds,
  accessories: item.accessories,
  numberEntryUnit: item.numberEntryUnit ?? '',
  numberEntryMin: item.numberEntryMin != null ? String(item.numberEntryMin) : '',
  numberEntryMax: item.numberEntryMax != null ? String(item.numberEntryMax) : '',
  ratingScale: item.ratingScale != null ? String(item.ratingScale) : '5',
  options: item.options,
  gpsTargetLat: item.gpsTargetLat != null ? String(item.gpsTargetLat) : '',
  gpsTargetLng: item.gpsTargetLng != null ? String(item.gpsTargetLng) : '',
  gpsRadiusMeters: item.gpsRadiusMeters != null ? String(item.gpsRadiusMeters) : '',
  qrExpectedValue: item.qrExpectedValue ?? '',
  cashExpectedAmount: item.cashExpectedAmount != null ? String(item.cashExpectedAmount) : '',
  conditionalTrigger: item.conditionalTrigger ?? '',
  conditionalActions: item.conditionalActions ?? [],
});

const SIGNATURE_LABELS: Record<string, string[]> = {
  SIGNATURE: ['Signature'],
  DUAL_SIGNATURE: ['Employee', 'Supervisor'],
};

const buildItemPayloads = (itemDrafts: ItemDraft[]): CreateChecklistDefinitionItemPayload[] =>
  itemDrafts
    .filter(d => d.label.trim())
    .map(d => ({
      label: d.label.trim(),
      requiredImageCount: Number(d.requiredImageCount) || 0,
      maxImageCount: d.maxImageCount ? Number(d.maxImageCount) : undefined,
      requiresLivePhoto: d.requiresLivePhoto,
      itemType: d.itemType,
      ...(d.itemType === 'AUDIT' ? { auditUserIds: d.auditUserIds, accessories: d.accessories } : {}),
      ...(d.itemType === 'NUMBER_ENTRY' || d.itemType === 'CASH_TALLY' ? {
        numberEntryUnit: d.numberEntryUnit.trim() || undefined,
        numberEntryMin: d.numberEntryMin.trim() ? Number(d.numberEntryMin) : undefined,
        numberEntryMax: d.numberEntryMax.trim() ? Number(d.numberEntryMax) : undefined,
      } : {}),
      ...(d.itemType === 'RATING' ? { ratingScale: d.ratingScale.trim() ? Number(d.ratingScale) : undefined } : {}),
      ...(d.itemType === 'MULTIPLE_CHOICE' || d.itemType === 'DROPDOWN' ? { options: d.options } : {}),
      ...(d.itemType === 'GPS' ? {
        gpsTargetLat: d.gpsTargetLat.trim() ? Number(d.gpsTargetLat) : undefined,
        gpsTargetLng: d.gpsTargetLng.trim() ? Number(d.gpsTargetLng) : undefined,
        gpsRadiusMeters: d.gpsRadiusMeters.trim() ? Number(d.gpsRadiusMeters) : undefined,
      } : {}),
      ...(d.itemType === 'QR_SCAN' ? { qrExpectedValue: d.qrExpectedValue.trim() || undefined } : {}),
      ...(d.itemType === 'CASH_TALLY' ? { cashExpectedAmount: d.cashExpectedAmount.trim() ? Number(d.cashExpectedAmount) : undefined } : {}),
      ...(d.itemType === 'SIGNATURE' || d.itemType === 'DUAL_SIGNATURE' ? { signatureLabels: SIGNATURE_LABELS[d.itemType] } : {}),
      ...(d.conditionalTrigger && (d.itemType === 'YES_NO' || d.itemType === 'PASS_FAIL') ? {
        conditionalTrigger: d.conditionalTrigger,
        conditionalActions: d.conditionalActions,
      } : {}),
    }));

export const ChecklistBuilder = () => {
  const { definitionId } = useParams();
  const isEditing = !!definitionId;
  const navigate = useNavigate();

  const { data: existing, isPending: isLoadingExisting, isError: loadError } = useChecklistDefinitionQuery(definitionId ?? '');
  const { data: templates } = useChecklistTemplatesQuery();
  const createDefinition = useCreateChecklistDefinitionMutation();
  const updateDefinition = useUpdateChecklistDefinitionMutation();
  const mutation = isEditing ? updateDefinition : createDefinition;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<ChecklistRecurrence>('DAILY');
  const [startDate, setStartDate] = useState('');
  const [opensTime, setOpensTime] = useState('');
  const [cutoffTime, setCutoffTime] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assigneeRoles, setAssigneeRoles] = useState<ChecklistAssigneeRole[]>([]);
  const [proofRequired, setProofRequired] = useState<ChecklistProofType[]>([]);
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);

  // Hydrate local state from the loaded definition exactly once — a later refetch (e.g. after
  // save) shouldn't clobber whatever the admin is mid-typing.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setName(existing.name);
    setDescription(existing.description ?? '');
    setStoreIds(existing.storeIds);
    setRecurrence(existing.recurrence);
    setStartDate(existing.startDate.slice(0, 10));
    setOpensTime(existing.opensTime ?? '');
    setCutoffTime(existing.cutoffTime ?? '');
    setAssigneeIds(existing.assigneeIds);
    setAssigneeRoles(existing.assigneeRoles);
    setProofRequired(existing.proofRequired);
    setItemDrafts(existing.items.length ? existing.items.map(toItemDraft) : [emptyItemDraft()]);
  }, [existing]);

  const primaryStoreId = storeIds[0] ?? '';

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const addItem = (patch: Partial<ItemDraft>) =>
    setItemDrafts(drafts => [...drafts, { ...emptyItemDraft(), ...patch }]);

  const removeItem = (index: number) =>
    setItemDrafts(drafts => drafts.filter((_, i) => i !== index));

  const handleImportTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (!template) return;
    setItemDrafts(drafts => [
      ...drafts.filter(d => d.label.trim()),
      ...template.items.map(item => ({
        ...emptyItemDraft(),
        label: item.label,
        requiredImageCount: String(item.requiredImageCount),
        maxImageCount: item.maxImageCount != null ? String(item.maxImageCount) : '',
        requiresLivePhoto: item.requiresLivePhoto,
      })),
    ]);
  };

  const items = buildItemPayloads(itemDrafts);
  const canSubmit =
    !!name.trim() &&
    storeIds.length > 0 &&
    !!startDate &&
    assigneeIds.length > 0 &&
    items.length > 0 &&
    itemDrafts.every(d => !d.label.trim() || d.itemType !== 'AUDIT' || d.auditUserIds.length > 0) &&
    itemDrafts.every(d => !d.label.trim() || (d.itemType !== 'MULTIPLE_CHOICE' && d.itemType !== 'DROPDOWN') || d.options.length >= 2) &&
    itemDrafts.every(d => !d.label.trim() || d.itemType !== 'GPS' || !d.gpsRadiusMeters.trim() || (d.gpsTargetLat.trim() !== '' && d.gpsTargetLng.trim() !== ''));

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      storeIds,
      recurrence,
      startDate: new Date(startDate).toISOString(),
      opensTime: opensTime || undefined,
      cutoffTime: cutoffTime || undefined,
      assigneeIds,
      assigneeRoles: assigneeRoles.length ? assigneeRoles : undefined,
      proofRequired: proofRequired.length ? proofRequired : undefined,
      items,
    };

    if (isEditing) {
      updateDefinition.mutate({ id: definitionId!, payload }, {
        onSuccess: (updated) => navigate(`/admin/scheduled-checklists/${updated.id}`),
      });
    } else {
      createDefinition.mutate(payload, {
        onSuccess: (created) => navigate(`/admin/scheduled-checklists/${created.id}`),
      });
    }
  };

  if (isEditing && isLoadingExisting) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isEditing && (loadError || !existing)) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
        <AlertCircle size={15} />
        Failed to load this checklist.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <button
            onClick={() => navigate('/admin/scheduled-checklists')}
            className="flex items-center gap-1.5 text-xs font-display font-medium text-text-muted hover:text-text transition-colors cursor-pointer w-fit mb-2"
          >
            <ArrowLeft size={13} /> Back to Templates
          </button>
          <h1 className="font-display text-2xl font-bold text-text">
            {isEditing ? `Editing: ${existing?.name}` : 'New Checklist'}
          </h1>
          {isEditing && existing && (
            <p className="text-sm text-text-muted mt-0.5">
              Version {existing.version} · Live in {existing.storeIds.length} store{existing.storeIds.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || mutation.isPending} className="gap-1.5">
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? 'Save changes' : 'Create checklist'}
        </Button>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          <AlertCircle size={15} />
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to save checklist.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr_18rem] gap-6 items-start">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <QuestionTypePalette onAdd={addItem} />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Editing Template</p>
          <ChecklistDetailsFields
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
          />
          <ImportFromTemplateField templates={templates} onImport={handleImportTemplate} />

          <div className="flex items-center justify-between">
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wider">
              Checklist Items
              <span className="ml-2 inline-flex items-center justify-center size-5 rounded-full bg-surface-hover border border-border/50 text-[10px] text-text-muted">
                {itemDrafts.length}
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-2.5">
            {itemDrafts.map((draft, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <ChecklistDefinitionItemDraftRow index={i} draft={draft} onChange={updateDraft} storeId={primaryStoreId} />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={itemDrafts.length === 1}
                  className="shrink-0 p-2 mt-1 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs font-display text-text-muted">
            Add more items from the Question Types panel on the left.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <BuilderSchedulePanel
            storeIds={storeIds}
            onStoreIdsChange={setStoreIds}
            recurrence={recurrence}
            onRecurrenceChange={setRecurrence}
            startDate={startDate}
            onStartDateChange={setStartDate}
            opensTime={opensTime}
            onOpensTimeChange={setOpensTime}
            cutoffTime={cutoffTime}
            onCutoffTimeChange={setCutoffTime}
          />
          <BuilderAssignPanel
            storeId={primaryStoreId}
            assigneeIds={assigneeIds}
            onAssigneeIdsChange={setAssigneeIds}
            assigneeRoles={assigneeRoles}
            onAssigneeRolesChange={setAssigneeRoles}
          />
          <BuilderProofPanel selected={proofRequired} onChange={setProofRequired} />
        </div>
      </div>
    </div>
  );
};
