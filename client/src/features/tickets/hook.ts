import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { ticketApi } from '../../api/ticket';
import type {
  CreateTicketPayload,
  UpdateTicketPayload,
  CreateChecklistPayload,
  UpdateChecklistItemPayload,
} from '../../api/ticket';

const KEYS = {
  all:    (page: number) => ['tickets', page]         as const,
  detail: (id: string)   => ['tickets', 'detail', id] as const,
};

export const useTicketsQuery = (page = 1) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.all(page),
    queryFn:  () => ticketApi.getAll(token!, page),
    enabled:  !!token,
  });
};

export const useTicketQuery = (id: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => ticketApi.getOne(id, token!).then(r => r.data),
    enabled:  !!token && !!id,
  });
};

export const useCreateTicketMutation = () => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketApi.create(payload, token!).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });
};

export const useUpdateTicketMutation = () => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketPayload }) =>
      ticketApi.update(id, payload, token!).then(r => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEYS.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useDeleteTicketMutation = () => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.delete(id, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });
};

export const useAddChecklistMutation = (ticketId: string) => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChecklistPayload) =>
      ticketApi.addChecklist(ticketId, payload, token!).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useDeleteChecklistMutation = (ticketId: string) => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklist(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateChecklistItemMutation = (ticketId: string) => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChecklistItemPayload }) =>
      ticketApi.updateChecklistItem(id, payload, token!).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useDeleteChecklistItemMutation = (ticketId: string) => {
  const { token }   = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteChecklistItem(id, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.detail(ticketId) }),
  });
};
