import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../components';
import { useReportExportMutation } from './useReportExport';
import { computeRange, PRESET_LABELS, type ReportPreset } from './dateRangePresets';
import type { ReportModule, ReportFormat } from '../../api/reports';

const PRESETS: ReportPreset[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const FORMATS: ReportFormat[] = ['csv', 'xlsx'];

interface ReportExportPanelProps {
  reportModule: ReportModule;
  description: string;
}

export const ReportExportPanel = ({ reportModule, description }: ReportExportPanelProps) => {
  const [preset, setPreset] = useState<ReportPreset>('monthly');
  const [format, setFormat] = useState<ReportFormat>('csv');
  const exportMutation = useReportExportMutation(reportModule);

  const handleDownload = () => {
    const { from, to } = computeRange(preset, new Date());
    exportMutation.mutate({ from, to, format });
  };

  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl border border-border/60 bg-surface">
      <p className="text-xs text-text-muted font-display">{description}</p>

      {/* Period Presets */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-display font-semibold text-text-secondary uppercase tracking-wider">
          Period
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 text-xs font-display font-medium rounded-md border transition-all cursor-pointer ${
                preset === p
                  ? 'border-primary-500/60 bg-primary-500/10 text-primary-500 font-semibold'
                  : 'border-border/60 bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Format Toggle */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-display font-semibold text-text-secondary uppercase tracking-wider">
          Format
        </span>
        <div className="flex gap-1 p-1 bg-surface-hover rounded-lg w-fit">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 text-xs font-display font-medium rounded-md transition-colors cursor-pointer uppercase ${
                format === f ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Button
        size="sm"
        variant="primary"
        className="self-start gap-1.5 font-display text-xs"
        onClick={handleDownload}
        isLoading={exportMutation.isPending}
      >
        {!exportMutation.isPending && <Download size={14} />}
        {exportMutation.isPending ? 'Preparing download…' : `Download ${PRESET_LABELS[preset]}`}
      </Button>
    </div>
  );
};
