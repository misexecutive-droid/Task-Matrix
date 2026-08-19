import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '../api/http';

// Shared by every feature's hook.ts — was previously copy-pasted identically in
// features/tickets/hook.ts and features/tasks/hook.ts.
export const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

// Stops React Query from retrying a query when the failure is a 401 — no point hammering the
// server once the session itself is invalid. Pass as a query's `retry` option.
export const handleQueryRetry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && error.status === 401) return false;
  return failureCount < 3;
};

type EntityMutationConfig<TVars, TResult> = {
  mutationFn: (vars: TVars) => Promise<TResult>;
  // Query keys to invalidate on success, e.g. [['tickets'], KEYS.detail(ticketId)].
  invalidateKeys: readonly (readonly unknown[])[];
  // Write the mutation result straight into a detail-cache entry instead of waiting on a
  // refetch — used by update/verify mutations that return the full updated entity.
  setDetailData?: (result: TResult, vars: TVars) => { key: readonly unknown[]; data: TResult } | void;
  // Drop a cache entry entirely — used by delete mutations, where `vars` is usually the id.
  removeKey?: (result: TResult, vars: TVars) => readonly unknown[] | void;
  // null/omitted = no success toast (e.g. checkbox-toggle mutations that should feel instant).
  successMessage?: string | ((result: TResult, vars: TVars) => string) | null;
  errorFallback: string;
};

// The shape behind nearly every ticket/task mutation in this app: run mutationFn, then on
// success update/invalidate the relevant caches and optionally toast, or toast an error message
// on failure. Extracted so each feature's hook.ts stops re-implementing the same onSuccess/
// onError wiring for every single mutation.
export function useEntityMutation<TVars, TResult>(config: EntityMutationConfig<TVars, TResult>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: (result, vars) => {
      const detail = config.setDetailData?.(result, vars);
      if (detail) queryClient.setQueryData(detail.key, detail.data);

      const removed = config.removeKey?.(result, vars);
      if (removed) queryClient.removeQueries({ queryKey: removed });

      config.invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));

      if (config.successMessage != null) {
        const msg = typeof config.successMessage === 'function'
          ? config.successMessage(result, vars)
          : config.successMessage;
        toast.success(msg);
      }
    },
    onError: (err) => toast.error(errorMessage(err, config.errorFallback)),
  });
}
