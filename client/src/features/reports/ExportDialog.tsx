import { FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportExportPanel } from './ReportExportPanel';
import type { ReportModule } from '../../api/reports';

interface ExportDialogProps {
  reportModule: ReportModule;
  title: string;
  description: string;
  onClose: () => void;
}

export const ExportDialog = ({ reportModule, title, description, onClose }: ExportDialogProps) => (
  <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
    <DialogContent className="w-[95vw] sm:w-full sm:max-w-md border-border/50 bg-surface/95 backdrop-blur-md shadow-2xl rounded-2xl">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20 shrink-0">
            <FileDown className="w-4 h-4" />
          </div>
          <DialogTitle className="text-base font-semibold text-text">{title}</DialogTitle>
        </div>
      </DialogHeader>

      <ReportExportPanel reportModule={reportModule} description={description} />
    </DialogContent>
  </Dialog>
);
