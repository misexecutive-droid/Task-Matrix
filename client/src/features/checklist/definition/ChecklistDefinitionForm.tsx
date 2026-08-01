import { useState } from 'react';
import { ListChecks, AlertCircle } from 'lucide-react';
import { Button } from '../../../components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-xl border-border/50 bg-surface/90 backdrop-blur-xl shadow-2xl p-0 rounded-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all">

        {/* Ambient Top Glow Banner */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 opacity-90 z-10" />

        {/* Pinned Header */}
        <DialogHeader className="shrink-0 px-4 pt-5 sm:px-7 sm:pt-7 pb-4 border-b border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/25 shadow-inner shrink-0">
                <ListChecks className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight text-text flex items-center gap-2 truncate">
                  New Recurring Checklist
                </DialogTitle>
                <p className="text-xs text-text-muted font-display mt-0.5 truncate sm:whitespace-normal">
                  Regenerates automatically on a schedule and assigns to specific team members. For a
                  one-off checklist on a single task or ticket, create a Checklist Template instead.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 sm:gap-6 px-4 py-4 sm:px-7 sm:py-6 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-border/40 hover:scrollbar-thumb-border/80">
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
        </div>

        <DialogFooter className="shrink-0 px-4 py-4 sm:px-7 border-t border-border/40 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
