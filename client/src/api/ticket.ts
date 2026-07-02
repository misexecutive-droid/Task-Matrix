const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Priority       = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssignmentMode = 'AUTO' | 'MANUAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'CLOSED' | 'ON_HOLD' | 'OVERDUE' | 'ONTIME';


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


export type UpdateTicketPayload = Partial<CreateTicketPayload & { status: TicketStatus }>;

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

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${token}`,
});

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
  const res  = await fetch(`${BASE}${path}`, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? 'Request failed');
  return json as T;
};

export const ticketApi = {
  getAll: (token: string, page = 1, limit = 20) =>
    request<PaginatedResponse<Ticket>>(`/tickets?page=${page}&limit=${limit}`, {
      headers: authHeaders(token),
    }),

  getOne: (id: string, token: string) =>
    request<ApiResponse<Ticket>>(`/tickets/${id}`, {
      headers: authHeaders(token),
    }),

  create: (payload: CreateTicketPayload, token: string) =>
    request<ApiResponse<Ticket>>('/tickets', {
      method:  'POST',
      headers: authHeaders(token),
      body:    JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateTicketPayload, token: string) =>
    request<ApiResponse<Ticket>>(`/tickets/${id}`, {
      method:  'PATCH',
      headers: authHeaders(token),
      body:    JSON.stringify(payload),
    }),

  delete: (id: string, token: string) =>
    request<ApiResponse<{ deleted: boolean }>>(`/tickets/${id}`, {
      method:  'DELETE',
      headers: authHeaders(token),
    }),

  addChecklist: (ticketId: string, payload: CreateChecklistPayload, token: string) =>
    request<ApiResponse<Checklist>>(`/tickets/${ticketId}/checklists`, {
      method:  'POST',
      headers: authHeaders(token),
      body:    JSON.stringify(payload),
    }),

  deleteChecklist: (id: string, token: string) =>
    request<ApiResponse<{ deleted: boolean }>>(`/checklists/${id}`, {
      method:  'DELETE',
      headers: authHeaders(token),
    }),

  updateChecklistItem: (id: string, payload: UpdateChecklistItemPayload, token: string) =>
    request<ApiResponse<ChecklistItem>>(`/checklist-items/${id}`, {
      method:  'PATCH',
      headers: authHeaders(token),
      body:    JSON.stringify(payload),
    }),

  deleteChecklistItem: (id: string, token: string) =>
    request<ApiResponse<{ deleted: boolean }>>(`/checklist-items/${id}`, {
      method:  'DELETE',
      headers: authHeaders(token),
    }),
};
