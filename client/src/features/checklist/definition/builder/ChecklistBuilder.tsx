import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Trash2, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '../../../../components';
import { Badge } from '@/components/ui/badge';
import {
  useChecklistDefinitionQuery,
  useCreateChecklistDefinitionMutation,
  useUpdateChecklistDefinitionMutation,
} from '../../hook';
import { ChecklistDetailsFields } from '../form/ChecklistDetailsFields';
import { ImportFromTemplateField } from '../form/ImportFromTemplateField';
import { useChecklistTemplatesQuery } from '../../hook';
import { QuestionTypePalette } from './QuestionTypePalette';
import { isItemDraftComplete } from './ItemTypeConfigFields';
import { BuilderSchedulePanel } from './BuilderSchedulePanel';
import { BuilderAssignPanel } from './BuilderAssignPanel';
import { BuilderProofPanel } from './BuilderProofPanel';
import { BuilderStepper } from './wizard/BuilderStepper';
import { BuilderStepFrame } from './wizard/BuilderStepFrame';
import { BuilderReviewStep } from './wizard/BuilderReviewStep';
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

const STEPS = [
  { key: 'basics', label: 'Basics' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'items', label: 'Items' },
  { key: 'assign', label: 'Assign & Proof' },
  { key: 'review', label: 'Review' },
] as const;

export const ChecklistBuilder = () => {
  const { definitionId } = useParams();
  const isEditing = !!definitionId;
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

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
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([]);

  // Edit mode lands on Review — the only entry point is "Edit in Builder" from an existing,
  // presumably-valid checklist, so there's no reason to walk the admin through onboarding again.
  const [step, setStep] = useState(() => (definitionId ? STEPS.length - 1 : 0));
  const [maxStepReached, setMaxStepReached] = useState(step);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goToStep = (index: number) => {
    setDirection(index > step ? 1 : -1);
    setStep(index);
    setMaxStepReached(m => Math.max(m, index));
  };

  // Hydrate local state from the loaded definition exactly once per definition — a later refetch
  // (e.g. after save, or a window-focus refetch) shouldn't clobber whatever the admin is
  // mid-typing. Done during render, React's "adjusting state when a prop changes" pattern
  // (react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes),
  // rather than in an effect: an effect only runs after commit, which would leave a one-render
  // gap between `existing` resolving and local state catching up — invisible on the old
  // all-at-once layout, but a visible flash of "0 stores, 0 items" now that Review can be the
  // first thing rendered in edit mode. Keyed by id (not a plain once-only flag) so it re-hydrates
  // correctly if this instance ever gets reused for a different definitionId.
  const [hydratedId, setHydratedId] = useState<string | undefined>(undefined);
  if (existing && hydratedId !== existing.id) {
    setHydratedId(existing.id);
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
    setItemDrafts(existing.items.map(toItemDraft));
  }

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
  const basicsValid = !!name.trim();
  const scheduleValid = storeIds.length > 0 && !!startDate;
  const itemsValid = items.length > 0 && itemDrafts.every(d => !d.label.trim() || isItemDraftComplete(d));
  const assignValid = assigneeIds.length > 0;
  const sectionValidity = [basicsValid, scheduleValid, itemsValid, assignValid] as const;
  const canSubmit = sectionValidity.every(Boolean);
  const isStepValid = (index: number) => (index < sectionValidity.length ? sectionValidity[index] : true);

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
        <Skeleton className="h-64 w-full rounded-xl" />
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

  const stepContent = [
    <BuilderStepFrame key="basics" stepIndex={step} title="Basics" description="Give this checklist a name your team will recognize.">
      <div className="max-w-2xl">
        <ChecklistDetailsFields name={name} onNameChange={setName} description={description} onDescriptionChange={setDescription} />
      </div>
    </BuilderStepFrame>,

    <BuilderStepFrame key="schedule" stepIndex={step} title="Schedule" description="Choose which stores run this checklist and how often.">
      <div className="max-w-xl">
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
      </div>
    </BuilderStepFrame>,

    <BuilderStepFrame key="items" stepIndex={step} title="Checklist Items" description="Add the steps your team needs to complete, in order.">
      <div className="flex flex-col gap-4">
        <ImportFromTemplateField templates={templates} onImport={handleImportTemplate} />
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6 items-start">
          <div className="rounded-xl border border-border bg-surface shadow-sm p-4 lg:sticky lg:top-6">
            <QuestionTypePalette onAdd={addItem} storeId={primaryStoreId} />
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-xs font-display font-semibold text-text-secondary uppercase tracking-wider">
              Checklist Items
              <Badge variant="outline">{itemDrafts.length}</Badge>
            </label>

            {itemDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-4 rounded-xl border border-dashed border-border bg-surface-hover/30 text-center">
                <span className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-600/20">
                  <ListChecks size={18} />
                </span>
                <p className="text-sm font-display font-semibold text-text">No items yet</p>
                <p className="text-xs font-display text-text-muted max-w-56">
                  Pick a question type from the panel on the left to add your first item.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {itemDrafts.map((draft, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <ChecklistDefinitionItemDraftRow index={i} draft={draft} onChange={updateDraft} storeId={primaryStoreId} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="shrink-0 p-2 mt-1 text-text-light hover:text-danger hover:bg-danger/10 rounded-md transition-colors duration-150 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BuilderStepFrame>,

    <BuilderStepFrame key="assign" stepIndex={step} title="Assign & Proof" description="Decide who's responsible and what evidence they must provide.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BuilderAssignPanel
          storeId={primaryStoreId}
          assigneeIds={assigneeIds}
          onAssigneeIdsChange={setAssigneeIds}
          assigneeRoles={assigneeRoles}
          onAssigneeRolesChange={setAssigneeRoles}
        />
        <BuilderProofPanel selected={proofRequired} onChange={setProofRequired} />
      </div>
    </BuilderStepFrame>,

    <BuilderStepFrame key="review" stepIndex={step} title="Review & Create" description="Double-check everything below, then create the checklist.">
      <BuilderReviewStep
        name={name}
        description={description}
        storeIds={storeIds}
        recurrence={recurrence}
        startDate={startDate}
        opensTime={opensTime}
        cutoffTime={cutoffTime}
        itemDrafts={itemDrafts}
        assigneeIds={assigneeIds}
        assigneeRoles={assigneeRoles}
        proofRequired={proofRequired}
        sectionValidity={sectionValidity}
        onEditSection={goToStep}
        canSubmit={canSubmit}
        isSubmitting={mutation.isPending}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        submitError={mutation.isError ? (mutation.error instanceof Error ? mutation.error.message : 'Failed to save checklist.') : undefined}
      />
    </BuilderStepFrame>,
  ];

  const progressPercent = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <ListChecks size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text leading-tight">
              {isEditing ? `Editing: ${existing?.name}` : 'New Checklist'}
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {isEditing && existing
                ? `Version ${existing.version} · Live in ${existing.storeIds.length} store${existing.storeIds.length !== 1 ? 's' : ''}`
                : 'Build a recurring checklist your team runs on a schedule.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/scheduled-checklists')}
          className="press-feedback flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold text-text-secondary border border-border bg-surface hover:bg-surface-hover hover:text-text transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Templates
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 px-5 sm:px-6 py-5 border-b border-border/60 bg-surface-hover/30">
          <BuilderStepper
            steps={STEPS}
            current={step}
            maxReached={maxStepReached}
            allUnlocked={isEditing}
            isStepValid={isStepValid}
            onSelect={goToStep}
          />
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
              transition={{ duration: shouldReduceMotion ? 0.05 : 0.2, ease: 'easeOut' }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/60">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="press-feedback flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold text-text-secondary border border-border bg-surface hover:bg-surface-hover transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                <ChevronLeft size={15} /> Back
              </button>
            ) : <span />}

            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                disabled={!sectionValidity[step]}
                className="press-feedback flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-display font-semibold text-white bg-primary-700 shadow-sm transition-all duration-150 hover:bg-primary-800 hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              >
                Next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
