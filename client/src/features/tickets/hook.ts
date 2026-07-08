import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { ticketApi } from '../../api/ticket';
import type {
  CreateTicketPayload,
  UpdateTicketPayload,
  CreateChecklistPayload,
  UpdateChecklistItemPayload,
} from '../../api/ticket';
import { userApi } from "../../api/users";

const KEYS = {
  all:    (page: number) => ['tickets', page]         as const,
  detail: (id: string)   => ['tickets', 'detail', id] as const,
};

// Helper function to prevent React Query from retrying on 401 Unauthorized errors
const handleQueryRetry = (failureCount: number, error: any) => {
  if (error?.response?.status === 401 || error?.status === 401) {
    return false;
  }
  return failureCount < 3;
};

export const useTicketsQuery = (page = 1) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.all(page),
    queryFn:  () => ticketApi.getAll(page),
    enabled:  !!token,
    retry:    handleQueryRetry,
  });
};

export const useTicketQuery = (id: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => ticketApi.getOne(id).then(r => r.data),
    enabled:  !!token && !!id,
    retry:    handleQueryRetry,
  });
};

export const useCreateTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketApi.create(payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
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
    },
  });
};

export const useDeleteTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
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
    },
  });
};

export const useDeleteChecklistMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
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
  });
};

export const useDeleteChecklistItemMutation = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklistItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) }),
  });
};

export const useAssignableUsersQuery = (departmentId?: string) => {
  const { token, user } = useAuth();
  return useQuery({
    queryKey : ['assignable-users', departmentId ?? 'all'],
    queryFn : () => userApi.getAssignable(departmentId).then(r => r.data),
    enabled : !!token && (user?.role === "ADMIN" || user?.role === "MANAGER"),
    retry:    handleQueryRetry,
  });
};

export const useDepartmentsQuery = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['departments'],
    queryFn:  () => departmentApi.getAll().then(r => r.data),
    enabled:  !!token,
  });
};


