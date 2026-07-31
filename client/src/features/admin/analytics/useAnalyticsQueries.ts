import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { taskApi } from '../../../api/task';
import { ticketApi } from '../../../api/ticket';
import { checklistInstanceApi } from '../../../api/checklistInstances';
import { handleQueryRetry } from '../../../lib/queryHelpers';
import type { GroupBy } from './GroupByControl';

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


// export const useDepartmentComplianceReporttQuery = (groupBy : GroupBy, from?: string , to?: string) => {
//   const { token , user} = useAuth();
// }


// export const useDepartmentPerPersonWiseConplianceReportQuery = ( groupBy : GroupBy, from?: string , to?: string) => {
//   const { token, user } = useAuth()
// }