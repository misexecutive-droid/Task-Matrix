import { apiFetch } from './http';
import type { ApiResponse, ChecklistRecurrence } from './checklistDefinitions';

export type ChecklistInstanceStatus = 'OPEN' | 'COMPLETED';

export type ChecklistInstanceItem = {
  id:          string;
  label:       string;
  order:       number;
  isDone:      boolean;
  completedAt: string | null;
  completedBy: string | null;
  instanceId:  string;
};

export type ChecklistInstance = {
  id:           string;
  definitionId: string;
  title:        string;
  recurrence:   ChecklistRecurrence;
  departmentId: string;
  assigneeIds:  string[];
  periodKey:    string;
  periodStart:  string;
  periodEnd:    string;
  generatedAt:  string;
  items:        ChecklistInstanceItem[];
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const checklistInstanceApi = {
  getMine: (status?: ChecklistInstanceStatus) =>
    apiFetch<ApiResponse<ChecklistInstance[]>>(`/checklist-instances/mine${buildQuery({ status })}`),

  getOne: (id: string) =>
    apiFetch<ApiResponse<ChecklistInstance>>(`/checklist-instances/${id}`),

  getForDefinition: (definitionId: string) =>
    apiFetch<ApiResponse<ChecklistInstance[]>>(`/checklist-instances${buildQuery({ definitionId })}`),

  setItemDone: (itemId: string, isDone: boolean) =>
    apiFetch<ApiResponse<ChecklistInstanceItem>>(`/checklist-instance-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isDone }),
    }),
};
