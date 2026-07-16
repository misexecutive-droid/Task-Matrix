import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ticketApi } from '../../api/ticket';
import type {
  CreateTicketPayload,
  UpdateTicketPayload,
  CreateChecklistPayload,
  UpdateChecklistItemPayload,
  TatReportGroupBy,
} from '../../api/ticket';
import { userApi } from "../../api/users";
import { departmentApi } from "../../api/departments";
import { checklistTemplateApi } from "../../api/checklistTemplates";

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const KEYS = {
  all: (page: number) => ['tickets', page] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
};

// Helper function to prevent React Query from retrying on 401 Unauthorized errors
const handleQueryRetry = (failureCount: number, error: any) => {
  if (error?.response?.status === 401 || error?.status === 401) {
    return false;
  }
  return failureCount < 3;
};

// export const useTicketsQuery = (page = 1) => {
//   const { token } = useAuth();
//   return useQuery({
//     queryKey: KEYS.all(page),
//     queryFn: () => ticketApi.getAll(page),
//     enabled: !!token,
//     retry: handleQueryRetry,
//   });
// };

export const useTicketsQuery = (page = 1 , limit = 20) => {
  const { token } = useAuth();
  return useQuery({
    queryKey : KEYS.all(page),
    queryFn : () => ticketApi.getAll(page ,limit),
    enabled : !!token,
    retry : handleQueryRetry
  })
}

export const useTicketQuery = (id: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => ticketApi.getOne(id).then(r => r.data),
    enabled: !!token && !!id,
    retry: handleQueryRetry,
  });
};

export const useCreateTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketApi.create(payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to create ticket')),
  });
};

export const useUpdateTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketPayload }) =>
      ticketApi.update(id, payload).then(r => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEYS.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to update ticket')),
  });
};

export const useDeleteTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket deleted');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to delete ticket')),
  });
};

export const useAddChecklistMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChecklistPayload) =>
      ticketApi.addChecklist(ticketId, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Checklist added');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to add checklist')),
  });
};

export const useDeleteChecklistMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Checklist deleted');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to delete checklist')),
  });
};

export const useUpdateChecklistItemMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChecklistItemPayload }) =>
      ticketApi.updateChecklistItem(id, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to update item')),
  });
};

export const useDeleteChecklistItemMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      toast.success('Item deleted');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to delete item')),
  });
};

export const useUpdateChecklistItemRemarksMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      ticketApi.updateChecklistItemRemarks(id, remarks).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      toast.success('Remarks saved');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to save remarks')),
  });
};

export const useCompleteChecklistItemMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.completeChecklistItem(id).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      toast.success('Item marked complete');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to complete item')),
  });
};

export const useUploadChecklistImagesMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, files, captureMethod }: { itemId: string; files: File[]; captureMethod: 'LIVE' | 'GALLERY' }) =>
      ticketApi.uploadChecklistImages(itemId, files, captureMethod).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      toast.success('Photos uploaded');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to upload photos')),
  });
};

export const useDeleteChecklistImageMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklistImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      toast.success('Photo deleted');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to delete photo')),
  });
};

// Reusable checklist templates (managed under Admin) that can be applied to a ticket in one
// click instead of typing the same checklist out by hand — see features/admin/ChecklistTemplateList.tsx.
export const useChecklistTemplatesQuery = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['checklist-templates', 'TICKET'],
    queryFn: () => checklistTemplateApi.getAll('TICKET').then(r => r.data),
    enabled: !!token,
  });
};

export const useApplyChecklistTemplateMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => checklistTemplateApi.applyToTicket(ticketId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      toast.success('Template applied');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to apply template')),
  });
};

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
  })
}

const DEPARTMENT_KEY = {
  all: ["departments"] as const,
};

export const useDepartmentsQuery = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: DEPARTMENT_KEY.all,
    queryFn: () => departmentApi.getAll().then(r => r.data),
    enabled: !!token,
  });
};