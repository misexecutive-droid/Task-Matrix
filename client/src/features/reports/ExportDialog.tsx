import { FileDown } from 'lucide-react';
import { Modal } from '@/components';
import { ReportExportPanel } from './ReportExportPanel';
import type { ReportModule } from '../../api/reports';

interface ExportDialogProps {
  reportModule: ReportModule;
  title: string;
  description: string;
  onClose: () => void;
}

export const ExportDialog = ({ reportModule, title, description, onClose }: ExportDialogProps) => (
  <Modal open onClose={onClose} size="md" icon={<FileDown className="w-4 h-4" />} title={title}>
    <ReportExportPanel reportModule={reportModule} description={description} />
  </Modal>
);
