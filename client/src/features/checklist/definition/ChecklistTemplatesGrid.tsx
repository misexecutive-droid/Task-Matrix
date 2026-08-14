import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, AlertCircle, ClipboardList, FileDown } from 'lucide-react';
import { Button, Skeleton } from '../../../components';
import { useChecklistDefinitionsQuery } from '../hook';
import { ChecklistDefinitionCard } from './ChecklistDefinitionCard';
import { ExportDialog } from '../../reports';

export const ChecklistTemplatesGrid = () => {
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);
  const { data: definitions = [], isPending, isError } = useChecklistDefinitionsQuery();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Checklist Templates</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Question sets, proof rules and versions — recurring checklists deployed across your stores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-display font-medium rounded-full border border-border/60 text-text-secondary hover:bg-surface-hover hover:text-text transition-all duration-200 cursor-pointer"
          >
            <FileDown size={14} />
            <span className="tracking-wide">Export</span>
          </button>
          <Button size="sm" variant="primary" className="gap-1.5" onClick={() => navigate('/admin/scheduled-checklists/builder')}>
            <Plus size={14} />
            New checklist
          </Button>
        </div>
      </div>

      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          <AlertCircle size={15} />
          Failed to load checklist templates.
        </div>
      )}

      {!isPending && !isError && definitions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-border bg-surface-hover/40 text-center">
          <div className="mb-5 text-text-muted">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-text mb-2">No checklist templates yet</h3>
          <p className="text-sm text-text-muted max-w-sm mb-8">
            Create your first recurring checklist to standardize procedures across your stores.
          </p>
          <Button variant="primary" onClick={() => navigate('/admin/scheduled-checklists/builder')} className="gap-1.5">
            <Plus size={14} />
            New checklist
          </Button>
        </div>
      )}

      {!isPending && !isError && definitions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {definitions.map(d => <ChecklistDefinitionCard key={d.id} definition={d} />)}
        </div>
      )}

      {showExport && (
        <ExportDialog
          reportModule="checklists"
          title="Export Checklists"
          description="Every recurring checklist instance generated in the selected period — completion progress per instance."
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};
