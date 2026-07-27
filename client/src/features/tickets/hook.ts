import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { ticketApi } from '../../api/ticket';
import type {
  CreateTicketPayload,
  UpdateTicketPayload,
  VerifyTicketPayload,
  CreateChecklistPayload,
  UpdateChecklistItemPayload,
  TatReportGroupBy,
  TicketStatus,
  RestrictedStatus,
  CaptureMethod,
} from '../../api/ticket';
import { userApi } from "../../api/users";
import { departmentApi } from "../../api/departments";
import { checklistTemplateApi } from "../../api/checklistTemplates";
import { handleQueryRetry, useEntityMutation } from '../../lib/queryHelpers';

const KEYS = {
  all: (page: number) => ['tickets', page] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
};

export const useTicketsQuery = (page = 1, limit = 20) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.all(page),
    queryFn: () => ticketApi.getAll(page, limit),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useTicketQuery = (id: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => ticketApi.getOne(id).then(r => r.data),
    enabled: !!token && !!id,
    retry: handleQueryRetry,
  });
};

export const useCreateTicketMutation = () =>
  useEntityMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketApi.create(payload).then(r => r.data),
    invalidateKeys: [['tickets']],
    successMessage: 'Ticket created',
    errorFallback: 'Failed to create ticket',
  });

export const useUpdateTicketMutation = () =>
  useEntityMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketPayload }) =>
      ticketApi.update(id, payload).then(r => r.data),
    setDetailData: (updated) => ({ key: KEYS.detail(updated.id), data: updated }),
    invalidateKeys: [['tickets']],
    successMessage: 'Ticket updated',
    errorFallback: 'Failed to update ticket',
  });

// The restricted status-update flow: a non-verifier moves a ticket to In Progress/On Hold/In
// Review with a mandatory remark and optional live/gallery evidence photos, bundled into one
// request — mirrors useVerifyTicketMutation's shape (also writes straight to the detail cache).
export const useAddTicketStatusUpdateMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (payload: { status: RestrictedStatus; remark: string; captureMethod?: CaptureMethod; files?: File[] }) =>
      ticketApi.addStatusUpdate(ticketId, payload).then(r => r.data),
    setDetailData: (updated) => ({ key: KEYS.detail(updated.id), data: updated }),
    invalidateKeys: [['tickets']],
    successMessage: 'Status updated',
    errorFallback: 'Failed to update status',
  });

// Powers the PC verification queue — tickets waiting on a given status (IN_REVIEW), scoped
// server-side to whatever the requester is allowed to see (PC/ADMIN get their whole department).
export const useTicketsByStatusQuery = (status: TicketStatus, limit = 100) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['tickets', 'by-status', status],
    queryFn: () => ticketApi.getAll(1, limit, status).then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useVerifyTicketMutation = () =>
  useEntityMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VerifyTicketPayload }) =>
      ticketApi.verify(id, payload).then(r => r.data),
    setDetailData: (updated) => ({ key: KEYS.detail(updated.id), data: updated }),
    invalidateKeys: [['tickets']],
    successMessage: (updated) => (updated.status === 'CLOSED' ? 'Ticket verified and closed' : 'Ticket sent back'),
    errorFallback: 'Failed to verify ticket',
  });

export const useDeleteTicketMutation = () =>
  useEntityMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    invalidateKeys: [['tickets']],
    successMessage: 'Ticket deleted',
    errorFallback: 'Failed to delete ticket',
  });

export const useAddChecklistMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (payload: CreateChecklistPayload) => ticketApi.addChecklist(ticketId, payload).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId), ['tickets']],
    successMessage: 'Checklist added',
    errorFallback: 'Failed to add checklist',
  });

export const useDeleteChecklistMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklist(id),
    invalidateKeys: [KEYS.detail(ticketId), ['tickets']],
    successMessage: 'Checklist deleted',
    errorFallback: 'Failed to delete checklist',
  });

export const useUpdateChecklistItemMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChecklistItemPayload }) =>
      ticketApi.updateChecklistItem(id, payload).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId), ['tickets']],
    errorFallback: 'Failed to update item',
  });

export const useDeleteChecklistItemMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklistItem(id),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Item deleted',
    errorFallback: 'Failed to delete item',
  });

export const useUpdateChecklistItemRemarksMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      ticketApi.updateChecklistItemRemarks(id, remarks).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Remarks saved',
    errorFallback: 'Failed to save remarks',
  });

export const useCompleteChecklistItemMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (id: string) => ticketApi.completeChecklistItem(id).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Item marked complete',
    errorFallback: 'Failed to complete item',
  });

export const useUploadChecklistImagesMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: ({ itemId, files, captureMethod }: { itemId: string; files: File[]; captureMethod: 'LIVE' | 'GALLERY' }) =>
      ticketApi.uploadChecklistImages(itemId, files, captureMethod).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Photos uploaded',
    errorFallback: 'Failed to upload photos',
  });

export const useDeleteChecklistImageMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklistImage(id),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Photo deleted',
    errorFallback: 'Failed to delete photo',
  });

export const useUploadTicketAttachmentMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (files: File[]) => ticketApi.uploadAttachments(ticketId, files).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Attachment uploaded',
    errorFallback: 'Failed to upload attachment',
  });

export const useDeleteTicketAttachmentMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (id: string) => ticketApi.deleteAttachment(id),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Attachment removed',
    errorFallback: 'Failed to remove attachment',
  });

export const useAddTicketCommentMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (body: string) => ticketApi.addComment(ticketId, body).then(r => r.data),
    invalidateKeys: [KEYS.detail(ticketId)],
    errorFallback: 'Failed to post comment',
  });

// Reusable checklist templates (managed under Admin) that can be applied to a ticket in one
// click instead of typing the same checklist out by hand — see features/admin/ChecklistTemplateList.tsx.
export const useChecklistTemplatesQuery = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['checklist-templates', 'TICKET'],
    queryFn: () => checklistTemplateApi.getAll('TICKET').then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useApplyChecklistTemplateMutation = (ticketId: string) =>
  useEntityMutation({
    mutationFn: (templateId: string) => checklistTemplateApi.applyToTicket(ticketId, templateId),
    invalidateKeys: [KEYS.detail(ticketId)],
    successMessage: 'Template applied',
    errorFallback: 'Failed to apply template',
  });

export const useAssignableUsersQuery = (departmentId?: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['assignable-users', departmentId ?? 'all'],
    queryFn: () => userApi.getAssignable(departmentId).then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useTatReportQuery = (groupBy: TatReportGroupBy) => {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["tickets", "tat-report", groupBy],
    queryFn: () => ticketApi.getTatReport(groupBy).then(r => r.data),
    enabled: !!token && user?.role === "ADMIN",
    retry: handleQueryRetry,
  });
};

const DEPARTMENT_KEY = {
  all: ["departments"] as const,
};

export const useDepartmentsQuery = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: DEPARTMENT_KEY.all,
    queryFn: () => departmentApi.getAll().then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};
