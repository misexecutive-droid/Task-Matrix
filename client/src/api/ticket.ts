import { apiFetch } from './http';

export type Priority       = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssignmentMode = 'AUTO' | 'MANUAL';
export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'CLOSED' | 'ON_HOLD';

export type ChecklistItem = {
  id:          string;
  label:       string;
  isDone:      boolean;
  assigneeId:  string | null;
  dueAt:       string | null;
  completedAt: string | null;
  checklistId: string;
};

export type Checklist = {
  id:       string;
  title:    string;
  ticketId: string;
  items:    ChecklistItem[];
};

export type Ticket = {
  id:             string;
  title:          string;
  description:    string;
  status:         TicketStatus;
  priority:       Priority;
  assignmentMode: AssignmentMode;
  tatHours:       number | null;
  tatDueAt:       string | null;
  userId:         string;
  assigneeId:     string | null;
  storeId:        string | null;
  categoryId:     string | null;
  departmentId:   string | null;
  createdAt:      string;
  updatedAt:      string;
  assignee:       { id: string; email: string; firstName: string; role: string } | null;
  checklists:     Checklist[];
  isOverdue:      boolean;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data:    T[];
  meta:    { page: number; limit: number; total: number; totalPages: number; hasNext: boolean };
};

export type ApiResponse<T> = {
  success: boolean;
  data:    T;
};

export type CreateTicketPayload = {
  title:           string;
  description:     string;
  priority?:       Priority;
  assignmentMode?: AssignmentMode;
  assigneeId?:     string;
  storeId?:        string;
  categoryId?:     string;
  departmentId?:   string;
  tatHours?:       number;
};

export type UpdateTicketPayload = Partial<Omit<CreateTicketPayload, 'assigneeId'> & { status: TicketStatus; assigneeId: string | null }>;

export type CreateChecklistPayload = {
  title:  string;
  items?: { label: string }[];
};

export type UpdateChecklistItemPayload = {
  label?:      string;
  isDone?:     boolean;
  assigneeId?: string;
  dueAt?:      string;
};

export const ticketApi = {
  getAll: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<Ticket>>(`/tickets?page=${page}&limit=${limit}`),

  getOne: (id: string) =>
    apiFetch<ApiResponse<Ticket>>(`/tickets/${id}`),

  create: (payload: CreateTicketPayload) =>
    apiFetch<ApiResponse<Ticket>>('/tickets', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateTicketPayload) =>
    apiFetch<ApiResponse<Ticket>>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  delete: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/tickets/${id}`, { method: 'DELETE' }),

  addChecklist: (ticketId: string, payload: CreateChecklistPayload) =>
    apiFetch<ApiResponse<Checklist>>(`/tickets/${ticketId}/checklists`, { method: 'POST', body: JSON.stringify(payload) }),

  deleteChecklist: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklists/${id}`, { method: 'DELETE' }),

  updateChecklistItem: (id: string, payload: UpdateChecklistItemPayload) =>
    apiFetch<ApiResponse<ChecklistItem>>(`/checklist-items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  deleteChecklistItem: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-items/${id}`, { method: 'DELETE' }),
};
