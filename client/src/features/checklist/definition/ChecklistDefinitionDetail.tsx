import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, AlertCircle, Repeat, Users, Calendar, Pencil, Gauge, Camera } from 'lucide-react';
import { Skeleton } from '../../../components';
import { useChecklistDefinitionQuery, useInstancesForDefinitionQuery, useStoresQuery } from '../hook';
import { ChecklistInstanceRow } from '../instance/ChecklistInstanceRow';
import {
  formatDate, instanceProgressStatus, INSTANCE_STATUS_LABEL, rateToneClass, rateBarClass,
  type InstanceProgressStatus,
} from '../checklistDisplay';
import type { ChecklistInstance } from '../../../api/checklistInstances';

const STATUS_ORDER: InstanceProgressStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

interface RateTileProps {
  icon: typeof Gauge;
  label: string;
  rate: number | null;
  emptyLabel: string;
}

const RateTile = ({ icon: Icon, label, rate, emptyLabel }: RateTileProps) => (
  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-surface flex-1 min-w-[10rem]">
    <span className="flex items-center gap-1.5 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
      <Icon size={13} />
      {label}
    </span>
    {rate !== null ? (
      <>
        <p className={`font-display text-2xl font-bold ${rateToneClass(rate)}`}>{rate}%</p>
        <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${rateBarClass(rate)}`}
            style={{ width: `${rate}%` }}
          />
        </div>
      </>
    ) : (
      <p className="text-sm font-display text-text-light">{emptyLabel}</p>
    )}
  </div>
);

const groupByStatus = (instances: ChecklistInstance[]) =>
  STATUS_ORDER.map(status => ({
    status,
    instances: instances.filter(i => {
      const done = i.items.filter(x => x.isDone).length;
      return instanceProgressStatus(done, i.items.length) === status;
    }),
  })).filter(group => group.instances.length > 0);

export const ChecklistDefinitionDetail = () => {
  const { definitionId = '' } = useParams();
  const navigate = useNavigate();
  const { data: definition, isPending, isError } = useChecklistDefinitionQuery(definitionId);
  const { data: instances = [] } = useInstancesForDefinitionQuery(definitionId);
  const { data: stores = [] } = useStoresQuery();

  const storeNames = definition
    ? definition.storeIds.map(id => stores.find(s => s.id === id)?.name ?? 'Unknown store').join(', ')
    : '';

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !definition) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-mono max-w-3xl">
        <AlertCircle size={15} />
        Failed to load checklist.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/admin/scheduled-checklists')}
          className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft size={13} /> Back to Templates
        </button>
        <Link
          to={`/admin/scheduled-checklists/builder/${definition.id}`}
          className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-full border border-primary-500/40 text-primary-700 hover:bg-primary-50 transition-colors"
        >
          <Pencil size={12} /> Edit in Builder
        </Link>
      </div>

      <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-primary-600 shrink-0">
            <Repeat size={18} />
          </div>
          <div>
            <h1 className="text-lg font-mono font-semibold text-text">{definition.name}</h1>
            {definition.description && (
              <p className="text-sm text-text-muted mt-0.5">{definition.description}</p>
            )}
          </div>
          {!definition.isActive && (
            <span className="ml-auto text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border shrink-0">
              Paused
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs font-mono text-text-muted pt-3 border-t border-border/50">
          <span>{storeNames}</span>
          <span className="flex items-center gap-1"><Users size={12} /> {definition.assigneeIds.length} assigned</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> Starts {formatDate(definition.startDate)}</span>
          <span className="font-semibold text-text-secondary">v{definition.version}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <RateTile icon={Gauge} label="Completion rate" rate={definition.completionRate} emptyLabel="No runs generated yet" />
        <RateTile icon={Camera} label="Photo compliance" rate={definition.qualityRate} emptyLabel="No photo-proof items yet" />
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-sm font-mono font-semibold text-text-muted uppercase tracking-wider">
          Generated Instances ({instances.length})
        </h2>
        {instances.length === 0 && (
          <div className="p-6 text-center text-sm text-text-muted bg-surface rounded-lg border border-dashed border-border font-mono">
            No instances generated yet.
          </div>
        )}
        {groupByStatus(instances).map(group => (
          <div key={group.status} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-semibold text-text uppercase tracking-wider">
                {INSTANCE_STATUS_LABEL[group.status]}
              </h3>
              <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border">
                {group.instances.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {group.instances.map(instance => <ChecklistInstanceRow key={instance.id} instance={instance} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
