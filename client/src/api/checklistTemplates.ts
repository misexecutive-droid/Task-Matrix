import { apiFetch } from './http';

export type ChecklistTemplateTarget = 'TASK' | 'TICKET';

export type ChecklistTemplateItem = {
  id:                 string;
  label:              string;
  order:              number;
  requiredImageCount: number;
  maxImageCount:      number | null;
  requiresLivePhoto:  boolean;
  templateId:         string;
};

export type ChecklistTemplate = {
  id:        string;
  name:      string;
  appliesTo: ChecklistTemplateTarget;
  createdBy: string;
  items:     ChecklistTemplateItem[];
};

export type ApiResponse<T> = { success: boolean; data: T };

export type CreateChecklistTemplateItemPayload = {
  label:               string;
  order?:              number;
  requiredImageCount?: number;
  maxImageCount?:      number;
  requiresLivePhoto?:  boolean;
};

export type CreateChecklistTemplatePayload = {
  name:      string;
  appliesTo: ChecklistTemplateTarget;
  items?:    CreateChecklistTemplateItemPayload[];
};

export type UpdateChecklistTemplatePayload = { name: string };

export type UpdateChecklistTemplateItemPayload = Omit<Partial<CreateChecklistTemplateItemPayload>, 'maxImageCount'> & {
  maxImageCount?: number | null;
};

export const checklistTemplateApi = {
  getAll: (appliesTo?: ChecklistTemplateTarget) =>
    apiFetch<ApiResponse<ChecklistTemplate[]>>(`/checklist-templates${appliesTo ? `?appliesTo=${appliesTo}` : ''}`),

  getOne: (id: string) =>
    apiFetch<ApiResponse<ChecklistTemplate>>(`/checklist-templates/${id}`),

  create: (payload: CreateChecklistTemplatePayload) =>
    apiFetch<ApiResponse<ChecklistTemplate>>('/checklist-templates', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateChecklistTemplatePayload) =>
    apiFetch<ApiResponse<ChecklistTemplate>>(`/checklist-templates/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  delete: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-templates/${id}`, { method: 'DELETE' }),

  addItem: (templateId: string, payload: CreateChecklistTemplateItemPayload) =>
    apiFetch<ApiResponse<ChecklistTemplateItem>>(`/checklist-templates/${templateId}/items`, { method: 'POST', body: JSON.stringify(payload) }),

  updateItem: (id: string, payload: UpdateChecklistTemplateItemPayload) =>
    apiFetch<ApiResponse<ChecklistTemplateItem>>(`/checklist-template-items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  deleteItem: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-template-items/${id}`, { method: 'DELETE' }),

  applyToTask: (taskId: string, templateId: string) =>
    apiFetch<ApiResponse<unknown>>(`/tasks/${taskId}/checklists/from-template/${templateId}`, { method: 'POST' }),

  applyToTicket: (ticketId: string, templateId: string) =>
    apiFetch<ApiResponse<unknown>>(`/tickets/${ticketId}/checklists/from-template/${templateId}`, { method: 'POST' }),
};