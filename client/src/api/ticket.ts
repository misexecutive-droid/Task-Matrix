import { apiFetch } from './http';

export type Priority       = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssignmentMode = 'AUTO' | 'MANUAL';
export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'CLOSED' | 'ON_HOLD';

export type TatReportGroupBy = "hour" | "day" | "week" | "month" | "year"

export type TatReportRow = {
  bucket : string;
  createdCount : number;
  closedCount : number;
  avgTatHours : number | null;
  overdueCount : number;
  completionRate : number | null;
}

export type CaptureMethod = 'LIVE' | 'GALLERY';

// The restricted set of statuses a non-verifier (assignee/creator/manager) can move a ticket to
// via the status-update flow — see ticket.validation.ts on the server for the matching schema.
export type RestrictedStatus = 'IN_PROGRESS' | 'ON_HOLD' | 'IN_REVIEW';

export type ChecklistImage = {
  id:               string;
  url:              string;
  originalFilename: string | null;
  mimeType:         string;
  sizeBytes:        number;
  captureMethod:    CaptureMethod;
  checklistItemId:  string;
  uploadedBy:       string;
  createdAt:        string;
};

export type ChecklistItem = {
  id:                 string;
  label:              string;
  isDone:             boolean;
  assigneeId:         string | null;
  dueAt:              string | null;
  completedAt:        string | null;
  checklistId:        string;
  requiredImageCount: number;
  maxImageCount:      number | null;
  requiresLivePhoto:  boolean;
  remarks:            string | null;
  images:             ChecklistImage[];
};

export type Checklist = {
  id:       string;
  title:    string;
  ticketId: string;
  items:    ChecklistItem[];
};

export type TicketStatusUpdate = {
  id:         string;
  ticketId:   string;
  fromStatus: TicketStatus;
  toStatus:   RestrictedStatus;
  remark:     string;
  changedBy:  { id: string; email: string; firstName: string; role: string } | null;
  photos:     TicketAttachment[];
  createdAt:  string;
};

export type TicketComment = {
  id:        string;
  body:      string;
  ticketId:  string;
  authorId:  string;
  author:    { id: string; email: string; firstName: string; role: string } | null;
  createdAt: string;
};

export type TicketAttachment = {
  id:               string;
  url:              string;
  originalFilename: string | null;
  mimeType:         string;
  sizeBytes:        number;
  captureMethod:    CaptureMethod;
  ticketId:         string;
  uploadedBy:       { id: string; email: string; firstName: string; role: string } | null;
  createdAt:        string;
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
  attachments:    TicketAttachment[];
  comments:       TicketComment[];
  statusUpdates:  TicketStatusUpdate[];
  isOverdue:      boolean;
  verifiedBy:       string | null;
  verifiedAt:       string | null;
  verificationNote: string | null;
  verifier:         { id: string; email: string; firstName: string; role: string } | null;
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

export type VerifyTicketPayload = { action: 'APPROVE' | 'REJECT'; note?: string };

export type CreateChecklistItemPayload = {
  label:               string;
  assigneeId?:         string;
  dueAt?:              string;
  requiredImageCount?: number;
  maxImageCount?:      number;
  requiresLivePhoto?:  boolean;
  remarks?:            string;
};

export type CreateChecklistPayload = {
  title:  string;
  items?: CreateChecklistItemPayload[];
};

export type UpdateChecklistItemPayload = {
  label?:              string;
  assigneeId?:         string | null;
  dueAt?:              string | null;
  requiredImageCount?: number;
  maxImageCount?:      number | null;
  requiresLivePhoto?:  boolean;
  isDone?:             false;
};

export const ticketApi = {
  getAll: (page = 1, limit = 20, status?: TicketStatus, assigneeId?: string) =>
    apiFetch<PaginatedResponse<Ticket>>(
      `/tickets?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}${assigneeId ? `&assigneeId=${assigneeId}` : ''}`,
    ),

  getOne: (id: string) =>
    apiFetch<ApiResponse<Ticket>>(`/tickets/${id}`),

  create: (payload: CreateTicketPayload) =>
    apiFetch<ApiResponse<Ticket>>('/tickets', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateTicketPayload) =>
    apiFetch<ApiResponse<Ticket>>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  verify: (id: string, payload: VerifyTicketPayload) =>
    apiFetch<ApiResponse<Ticket>>(`/tickets/${id}/verify`, { method: 'PATCH', body: JSON.stringify(payload) }),

  addStatusUpdate: (id: string, payload: { status: RestrictedStatus; remark: string; captureMethod?: CaptureMethod; files?: File[] }) => {
    const formData = new FormData();
    formData.append('status', payload.status);
    formData.append('remark', payload.remark);
    if (payload.captureMethod) formData.append('captureMethod', payload.captureMethod);
    (payload.files ?? []).forEach(f => formData.append('images', f));
    return apiFetch<ApiResponse<Ticket>>(`/tickets/${id}/status-updates`, { method: 'POST', body: formData });
  },

  delete: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/tickets/${id}`, { method: 'DELETE' }),

  addChecklist: (ticketId: string, payload: CreateChecklistPayload) =>
    apiFetch<ApiResponse<Checklist>>(`/tickets/${ticketId}/checklists`, { method: 'POST', body: JSON.stringify(payload) }),

  deleteChecklist: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklists/${id}`, { method: 'DELETE' }),

  updateChecklistItem: (id: string, payload: UpdateChecklistItemPayload) =>
    apiFetch<ApiResponse<ChecklistItem>>(`/checklist-items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  updateChecklistItemRemarks: (id: string, remarks: string) =>
    apiFetch<ApiResponse<ChecklistItem>>(`/checklist-items/${id}/remarks`, {
      method: 'PATCH',
      body:   JSON.stringify({ remarks }),
    }),

  completeChecklistItem: (id: string) =>
    apiFetch<ApiResponse<ChecklistItem>>(`/checklist-items/${id}/complete`, { method: 'POST' }),

  deleteChecklistItem: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-items/${id}`, { method: 'DELETE' }),

  uploadChecklistImages: (itemId: string, files: File[], captureMethod: CaptureMethod) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('captureMethod', captureMethod);
    return apiFetch<ApiResponse<ChecklistImage[]>>(`/checklist-items/${itemId}/images`, {
      method: 'POST',
      body:   formData,
    });
  },

  deleteChecklistImage: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-images/${id}`, { method: 'DELETE' }),

  uploadAttachments: (ticketId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return apiFetch<ApiResponse<TicketAttachment[]>>(`/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body:   formData,
    });
  },

  deleteAttachment: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/ticket-attachments/${id}`, { method: 'DELETE' }),

  addComment: (ticketId: string, body: string) =>
    apiFetch<ApiResponse<TicketComment>>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body:   JSON.stringify({ body }),
    }),

  // departmentId/storeId are only honored for ADMIN/PC callers — MANAGER/SENIOR get their own
  // scope forced server-side regardless of what's passed here (see ticket.controller.ts).
  getTatReport : ( groupBy : TatReportGroupBy = "day", from?: string, to?: string, departmentId?: string, storeId?: string) => {
    const params = new URLSearchParams({ groupBy });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (departmentId) params.set('departmentId', departmentId);
    if (storeId) params.set('storeId', storeId);
    return apiFetch<ApiResponse<TatReportRow[]>>(`/tickets/reports/tat?${params.toString()}`);
  },
};
