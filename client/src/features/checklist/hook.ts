import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import {
  checklistDefinitionApi,
  type CreateChecklistDefinitionPayload,
  type ListChecklistDefinitionsParams,
} from '../../api/checklistDefinitions';
import { checklistInstanceApi, type ChecklistInstanceStatus, type VerifyChecklistInstancePayload } from '../../api/checklistInstances';
import type { CaptureMethod } from '../../api/ticket';
import { useEntityMutation } from '../../lib/queryHelpers';

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

// Helper function to prevent React Query from retrying on 401 Unauthorized errors
const handleQueryRetry = (failureCount: number, error: any) => {
  if (error?.response?.status === 401 || error?.status === 401) return false;
  return failureCount < 3;
};

const KEYS = {
  definitions:            (filters: ListChecklistDefinitionsParams) => ['checklist-definitions', filters] as const,
  definitionDetail:       (id: string) => ['checklist-definitions', 'detail', id] as const,
  myInstances:            (status?: ChecklistInstanceStatus) => ['checklist-instances', 'mine', status ?? 'all'] as const,
  instanceDetail:         (id: string) => ['checklist-instances', 'detail', id] as const,
  instancesForDefinition: (definitionId: string) => ['checklist-instances', 'by-definition', definitionId] as const,
};

export const useChecklistDefinitionsQuery = (filters: ListChecklistDefinitionsParams = {}) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.definitions(filters),
    queryFn: () => checklistDefinitionApi.getAll(filters).then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useChecklistDefinitionQuery = (id: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.definitionDetail(id),
    queryFn: () => checklistDefinitionApi.getOne(id).then(r => r.data),
    enabled: !!token && !!id,
    retry: handleQueryRetry,
  });
};

export const useCreateChecklistDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChecklistDefinitionPayload) =>
      checklistDefinitionApi.create(payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-definitions'] });
      toast.success('Checklist created');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to create checklist')),
  });
};

export const useSetChecklistDefinitionActiveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      checklistDefinitionApi.setActive(id, isActive).then(r => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEYS.definitionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ['checklist-definitions'] });
      toast.success(updated.isActive ? 'Checklist resumed' : 'Checklist paused');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to update checklist')),
  });
};

export const useDeleteChecklistDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistDefinitionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-instances'] });
      toast.success('Checklist deleted');
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to delete checklist')),
  });
};

export const useMyChecklistInstancesQuery = (status?: ChecklistInstanceStatus) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.myInstances(status),
    queryFn: () => checklistInstanceApi.getMine(status).then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useChecklistInstanceQuery = (id: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.instanceDetail(id),
    queryFn: () => checklistInstanceApi.getOne(id).then(r => r.data),
    enabled: !!token && !!id,
    retry: handleQueryRetry,
  });
};

export const useInstancesForDefinitionQuery = (definitionId: string) => {
  const { token } = useAuth();
  return useQuery({
    queryKey: KEYS.instancesForDefinition(definitionId),
    queryFn: () => checklistInstanceApi.getForDefinition(definitionId).then(r => r.data),
    enabled: !!token && !!definitionId,
    retry: handleQueryRetry,
  });
};

export const useSetChecklistInstanceItemDoneMutation = (instanceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, isDone }: { itemId: string; isDone: boolean }) =>
      checklistInstanceApi.setItemDone(itemId, isDone).then(r => r.data),
    onSuccess: () => {
      // No success toast here — keeps checkbox-toggling snappy, matching
      // useUpdateChecklistItemMutation in tickets/hook.ts.
      queryClient.invalidateQueries({ queryKey: KEYS.instanceDetail(instanceId) });
      queryClient.invalidateQueries({ queryKey: ['checklist-instances', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-instances', 'by-definition'] });
    },
    onError: (err) => toast.error(errorMessage(err, 'Failed to update item')),
  });
};

export const useUploadChecklistInstanceImagesMutation = (instanceId: string) =>
  useEntityMutation({
    mutationFn: ({ itemId, files, captureMethod }: { itemId: string; files: File[]; captureMethod: CaptureMethod }) =>
      checklistInstanceApi.uploadImages(itemId, files, captureMethod).then(r => r.data),
    invalidateKeys: [KEYS.instanceDetail(instanceId)],
    successMessage: 'Photos uploaded',
    errorFallback: 'Failed to upload photos',
  });

export const useDeleteChecklistInstanceImageMutation = (instanceId: string) =>
  useEntityMutation({
    mutationFn: (id: string) => checklistInstanceApi.deleteImage(id),
    invalidateKeys: [KEYS.instanceDetail(instanceId)],
    successMessage: 'Photo deleted',
    errorFallback: 'Failed to delete photo',
  });

// Powers the PC/Admin verification queue's Checklists section — instances with every item done,
// awaiting review. Scoped server-side (PC gets their own department, ADMIN gets every department).
export const usePendingVerificationChecklistInstancesQuery = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['checklist-instances', 'pending-verification'],
    queryFn: () => checklistInstanceApi.getPendingVerification().then(r => r.data),
    enabled: !!token,
    retry: handleQueryRetry,
  });
};

export const useVerifyChecklistInstanceMutation = () =>
  useEntityMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VerifyChecklistInstancePayload }) =>
      checklistInstanceApi.verify(id, payload).then(r => r.data),
    setDetailData: (updated) => ({ key: KEYS.instanceDetail(updated.id), data: updated }),
    invalidateKeys: [['checklist-instances']],
    successMessage: (updated) => (updated.verificationStatus === 'APPROVED' ? 'Checklist verified' : 'Checklist sent back'),
    errorFallback: 'Failed to verify checklist',
  });

export { useDepartmentsQuery, useAssignableUsersQuery } from '../tickets/hook';
// Templates are a separate one-off feature (see ChecklistDefinition model comment), but the
// definition form lets admins import a template's step labels as a starting point.
export { useChecklistTemplatesQuery } from '../admin/hook';
