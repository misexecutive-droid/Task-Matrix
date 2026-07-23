import { apiFetch } from './http';

export type ChecklistRecurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';

export type ChecklistDefinitionItem = {
  id:           string;
  label:        string;
  order:        number;
  definitionId: string;
};

export type ChecklistDefinition = {
  id:           string;
  name:         string;
  description:  string | null;
  departmentId: string;
  recurrence:   ChecklistRecurrence;
  startDate:    string;
  isActive:     boolean;
  assigneeIds:  string[];
  createdBy:    string;
  items:        ChecklistDefinitionItem[];
};

export type ApiResponse<T> = { success: boolean; data: T };

export type CreateChecklistDefinitionItemPayload = {
  label:  string;
  order?: number;
};

export type CreateChecklistDefinitionPayload = {
  name:         string;
  description?: string;
  departmentId: string;
  recurrence:   ChecklistRecurrence;
  startDate:    string;
  assigneeIds:  string[];
  items:        CreateChecklistDefinitionItemPayload[];
};

export type ListChecklistDefinitionsParams = {
  departmentId?: string;
  recurrence?:   ChecklistRecurrence;
  isActive?:     boolean;
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const checklistDefinitionApi = {
  getAll: (params: ListChecklistDefinitionsParams = {}) =>
    apiFetch<ApiResponse<ChecklistDefinition[]>>(`/checklist-definitions${buildQuery({
      departmentId: params.departmentId,
      recurrence:   params.recurrence,
      isActive:     params.isActive === undefined ? undefined : String(params.isActive),
    })}`),

  getOne: (id: string) =>
    apiFetch<ApiResponse<ChecklistDefinition>>(`/checklist-definitions/${id}`),

  create: (payload: CreateChecklistDefinitionPayload) =>
    apiFetch<ApiResponse<ChecklistDefinition>>('/checklist-definitions', { method: 'POST', body: JSON.stringify(payload) }),

  setActive: (id: string, isActive: boolean) =>
    apiFetch<ApiResponse<ChecklistDefinition>>(`/checklist-definitions/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  remove: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-definitions/${id}`, { method: 'DELETE' }),
};
