import { FileDown } from 'lucide-react';
import { Modal } from '@/components';
import { ReportExportPanel } from './ReportExportPanel';
import type { ReportModule, ReportExportParams } from '../../api/reports';

interface ExportDialogProps {
  reportModule: ReportModule;
  title: string;
  description: string;
  onClose: () => void;
  filters?: Pick<ReportExportParams, 'category' | 'status' | 'priority' | 'departmentId' | 'assigneeIds'>;
}

export const ExportDialog = ({ reportModule, title, description, onClose, filters }: ExportDialogProps) => (
  <Modal open onClose={onClose} size="md" icon={<FileDown className="w-4 h-4" />} title={title}>
    <ReportExportPanel reportModule={reportModule} description={description} filters={filters} />
  </Modal>
);
