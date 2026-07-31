// features/checklist-templates/components/ChecklistTemplateForm.tsx
import {useCreateChecklistTemplateMutation,  useDepartmentsQuery } from '../hook';
import { ChecklistTemplateFormUI } from './ChecklistTemplateFormUi';
import type { ChecklistTemplateTarget } from '../../../api/checklistTemplates';

interface FormPayload {
  name: string;
  appliesTo: ChecklistTemplateTarget;
  departmentId: string;
  items: any[];
}

export const ChecklistTemplateForm = ({ onClose }: { onClose: () => void }) => {
  const { data: departments = [] } = useDepartmentsQuery();
  const createMutation = useCreateChecklistTemplateMutation();

  const handleSubmit = (payload: FormPayload) => {
    createMutation.mutate(
      {
        name: payload.name.trim(),
        appliesTo: payload.appliesTo,
        departmentId: payload.departmentId || undefined,
        items: payload.items.length ? payload.items : undefined,
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <ChecklistTemplateFormUI
      departments={departments}
      isSaving={createMutation.isPending}
      saveError={createMutation.error?.message}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};