import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportApi, type ReportModule, type ReportExportParams } from '../../api/reports';
import { errorMessage } from '../../lib/queryHelpers';

export const useReportExportMutation = (reportModule: ReportModule) =>
  useMutation({
    mutationFn: (params: ReportExportParams) => reportApi.downloadExport(reportModule, params),
    onError: (err) => toast.error(errorMessage(err, 'Failed to export report')),
  });
