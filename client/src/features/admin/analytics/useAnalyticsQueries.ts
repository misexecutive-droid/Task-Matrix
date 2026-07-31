import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { taskApi } from '../../../api/task';
import { ticketApi } from '../../../api/ticket';
import { checklistInstanceApi } from '../../../api/checklistInstances';
import { handleQueryRetry } from '../../../lib/queryHelpers';
import type { GroupBy } from './GroupByControl';

// All three hooks below share the 'analytics' query-key namespace so none of them collide with
// other pages calling the same endpoints under a different key (e.g. features/tasks/hook.ts's
// useComplianceReportQuery, which powers the dashboard's Monthly Target gauge).

export const useTaskComplianceReportQuery = (groupBy: GroupBy, from?: string, to?: string) => {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'task-compliance', groupBy, from, to],
    queryFn: () => taskApi.getComplianceReport(groupBy, from, to).then((r) => r.data),
    enabled: !!token && user?.role === 'ADMIN',
    retry: handleQueryRetry,
  });
};

export const useTicketTatReportQuery = (groupBy: GroupBy, from?: string, to?: string) => {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'ticket-tat', groupBy, from, to],
    queryFn: () => ticketApi.getTatReport(groupBy, from, to).then((r) => r.data),
    enabled: !!token && user?.role === 'ADMIN',
    retry: handleQueryRetry,
  });
};

export const useChecklistInstanceComplianceReportQuery = (groupBy: GroupBy, from?: string, to?: string) => {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'checklist-instance-compliance', groupBy, from, to],
    queryFn: () => checklistInstanceApi.getComplianceReport(groupBy, undefined, from, to).then((r) => r.data),
    enabled: !!token && user?.role === 'ADMIN',
    retry: handleQueryRetry,
  });
};
