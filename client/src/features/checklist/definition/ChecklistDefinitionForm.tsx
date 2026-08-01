import { useState } from 'react';
import { ListChecks, AlertCircle } from 'lucide-react';
import { Button, Modal } from '../../../components';
import { useCreateChecklistDefinitionMutation, useDepartmentsQuery, useChecklistTemplatesQuery } from '../hook';
import { emptyItemDraft, type ItemDraft } from './ChecklistDefinitionItemDraftRow';
import { ChecklistDetailsFields } from './form/ChecklistDetailsFields';
import { ChecklistScheduleFields } from './form/ChecklistScheduleFields';
import { ChecklistAssigneesField } from './form/ChecklistAssigneesField';
import { ChecklistItemsEditor } from './form/ChecklistItemsEditor';
import { ImportFromTemplateField } from './form/ImportFromTemplateField';
import type { ChecklistRecurrence } from '../../../api/checklistDefinitions';

interface ChecklistDefinitionFormProps {
  onClose: () => void;
}

export const ChecklistDefinitionForm = ({ onClose }: ChecklistDefinitionFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [recurrence, setRecurrence] = useState<ChecklistRecurrence>('DAILY');
  const [startDate, setStartDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([emptyItemDraft()]);

  const { data: departments } = useDepartmentsQuery();
  const { data: templates } = useChecklistTemplatesQuery();
  const createDefinition = useCreateChecklistDefinitionMutation();

  const updateDraft = (i: number, patch: Partial<ItemDraft>) =>
    setItemDrafts((drafts) => drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setAssigneeIds([]);
  };

  const handleImportTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;
    setItemDrafts((drafts) => [
      ...drafts.filter((d) => d.label.trim()),
      ...template.items.map((item) => ({
        label: item.label,
        requiredImageCount: String(item.requiredImageCount),
        maxImageCount: item.maxImageCount != null ? String(item.maxImageCount) : '',
        requiresLivePhoto: item.requiresLivePhoto,
        itemType: 'STANDARD' as const,
        auditUserIds: [],
        accessories: [],
      })),
    ]);
  };

  const items = itemDrafts
    .filter((d) => d.label.trim())
    .map((d) => ({
      label: d.label.trim(),
      requiredImageCount: Number(d.requiredImageCount) || 0,
      maxImageCount: d.maxImageCount ? Number(d.maxImageCount) : undefined,
      requiresLivePhoto: d.requiresLivePhoto,
      itemType: d.itemType,
      ...(d.itemType === 'AUDIT' ? { auditUserIds: d.auditUserIds, accessories: d.accessories } : {}),
    }));
  const canSubmit =
    !!name.trim() &&
    !!departmentId &&
    !!startDate &&
    assigneeIds.length > 0 &&
    items.length > 0 &&
    itemDrafts.every((d) => !d.label.trim() || d.itemType !== 'AUDIT' || d.auditUserIds.length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    createDefinition.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        departmentId,
        recurrence,
        startDate: new Date(startDate).toISOString(),
        assigneeIds,
        items,
      },
      { onSuccess: onClose }
    );
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        disabled={createDefinition.isPending}
        className="w-full sm:w-auto h-10 sm:h-9 px-4 text-sm sm:text-xs font-display border-border/60 hover:bg-surface-hover hover:text-text rounded-lg transition-all"
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={!canSubmit}
        isLoading={createDefinition.isPending}
        className="w-full sm:w-auto h-10 sm:h-9 px-4 text-sm sm:text-xs font-display bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-md shadow-primary-500/20 rounded-lg transition-all active:scale-[0.98] disabled:from-surface-dark disabled:to-surface-dark disabled:text-text-muted disabled:shadow-none disabled:border disabled:border-border/50"
      >
        Create Checklist
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      icon={<ListChecks className="w-5 h-5" />}
      title="New Recurring Checklist"
      description="Regenerates automatically on a schedule and assigns to specific team members. For a one-off checklist on a single task or ticket, create a Checklist Template instead."
      footer={footer}
    >
          <ChecklistDetailsFields
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
          />

          <ChecklistScheduleFields
            departmentId={departmentId}
            onDepartmentChange={handleDepartmentChange}
            departments={departments}
            recurrence={recurrence}
            onRecurrenceChange={setRecurrence}
            startDate={startDate}
            onStartDateChange={setStartDate}
          />

          <ChecklistAssigneesField
            departmentId={departmentId}
            selected={assigneeIds}
            onChange={setAssigneeIds}
          />

          <ImportFromTemplateField templates={templates} onImport={handleImportTemplate} />

          <ChecklistItemsEditor
            itemDrafts={itemDrafts}
            onUpdateDraft={updateDraft}
            onAddDraft={() => setItemDrafts((d) => [...d, emptyItemDraft()])}
            departmentId={departmentId}
          />

          {createDefinition.isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 font-display flex items-start sm:items-center gap-2.5 animate-in fade-in slide-in-from-top-1 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5 sm:mt-0" />
              <p className="leading-tight">
                {createDefinition.error instanceof Error
                  ? createDefinition.error.message
                  : 'Failed to create checklist. Please try again.'}
              </p>
            </div>
          )}
    </Modal>
  );
};
