import type { ReactNode } from 'react';
import { Pencil, AlertCircle, Loader2, Store, Repeat, Calendar, Clock, Users, ShieldCheck } from 'lucide-react';
import { Button } from '../../../../../components';
import { Badge } from '@/components/ui/badge';
import { useStoresQuery } from '../../../hook';
import { useAssignableUsersQuery } from '../../../../tickets/hook';
import { RECURRENCE_LABEL, formatDate } from '../../../checklistDisplay';
import { PROOF_OPTIONS } from '../BuilderProofPanel';
import { ROLE_OPTIONS } from '../../form/ChecklistRolesField';
import { ITEM_TYPE_LABEL, type ItemDraft } from '../../ChecklistDefinitionItemDraftRow';
import type {
  ChecklistRecurrence, ChecklistAssigneeRole, ChecklistProofType,
} from '../../../../../api/checklistDefinitions';

interface BuilderReviewStepProps {
  name: string;
  description: string;
  storeIds: string[];
  recurrence: ChecklistRecurrence;
  startDate: string;
  opensTime: string;
  cutoffTime: string;
  itemDrafts: ItemDraft[];
  assigneeIds: string[];
  assigneeRoles: ChecklistAssigneeRole[];
  proofRequired: ChecklistProofType[];
  sectionValidity: readonly [boolean, boolean, boolean, boolean];
  onEditSection: (stepIndex: number) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  onSubmit: () => void;
  submitError?: string;
}

const SECTION_STEP_LABEL = ['Basics', 'Schedule', 'Items', 'Assign & Proof'];

const EditButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-full border border-primary-500/40 text-primary-700 hover:bg-primary-50 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
  >
    <Pencil size={12} /> Edit
  </button>
);

const SectionCard = ({
  title, icon, valid, onEdit, children,
}: { title: string; icon: ReactNode; valid: boolean; onEdit: () => void; children: ReactNode }) => (
  <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface shadow-xs">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-text-muted">
        {icon}
        {title}
      </span>
      <div className="flex items-center gap-2">
        {!valid && <Badge variant="warning">Needs attention</Badge>}
        <EditButton onClick={onEdit} />
      </div>
    </div>
    {children}
  </div>
);

export const BuilderReviewStep = ({
  name, description, storeIds, recurrence, startDate, opensTime, cutoffTime,
  itemDrafts, assigneeIds, assigneeRoles, proofRequired,
  sectionValidity, onEditSection, canSubmit, isSubmitting, isEditing, onSubmit, submitError,
}: BuilderReviewStepProps) => {
  const { data: stores = [] } = useStoresQuery();
  const { data: assignableUsers = [] } = useAssignableUsersQuery(undefined, storeIds[0]);

  const storeNames = storeIds.map(id => stores.find(s => s.id === id)?.name ?? 'Unknown store');
  const namedItems = itemDrafts.filter(d => d.label.trim());
  const assignees = assigneeIds.map(id => {
    const u = assignableUsers.find(a => a.id === id);
    if (!u) return 'Unknown user';
    const full = `${u.firstName} ${u.lastName ?? ''}`.trim();
    return full || u.email;
  });

  const incompleteLabels = sectionValidity
    .map((valid, i) => (valid ? null : SECTION_STEP_LABEL[i]))
    .filter((label): label is string => label !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Basics" icon={<Store size={13} />} valid={sectionValidity[0]} onEdit={() => onEditSection(0)}>
          <p className="text-sm font-display font-semibold text-text">{name.trim() || 'Untitled checklist'}</p>
          <p className="text-xs font-display text-text-muted">{description.trim() || 'No description added.'}</p>
        </SectionCard>

        <SectionCard title="Schedule" icon={<Repeat size={13} />} valid={sectionValidity[1]} onEdit={() => onEditSection(1)}>
          <div className="flex flex-col gap-1.5 text-xs font-display text-text-secondary">
            <span className="flex items-center gap-1.5"><Store size={12} className="text-text-muted" /> {storeNames.length ? storeNames.join(', ') : 'No stores selected'}</span>
            <span className="flex items-center gap-1.5"><Repeat size={12} className="text-text-muted" /> {RECURRENCE_LABEL[recurrence]}</span>
            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-text-muted" /> {startDate ? formatDate(new Date(startDate).toISOString()) : 'No date set'}</span>
            {(opensTime || cutoffTime) && (
              <span className="flex items-center gap-1.5"><Clock size={12} className="text-text-muted" /> {opensTime || '—'} to {cutoffTime || '—'}</span>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Items" icon={<ShieldCheck size={13} />} valid={sectionValidity[2]} onEdit={() => onEditSection(2)}>
          {namedItems.length === 0 ? (
            <p className="text-xs font-display text-text-muted">No items added yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {namedItems.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-display">
                  <span className="text-text-light tabular-nums shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 min-w-0 truncate text-text-secondary">{d.label}</span>
                  <Badge variant="outline" className="shrink-0">{ITEM_TYPE_LABEL[d.itemType]}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Assign & Proof" icon={<Users size={13} />} valid={sectionValidity[3]} onEdit={() => onEditSection(3)}>
          <div className="flex flex-col gap-2">
            {assigneeRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assigneeRoles.map(role => (
                  <Badge key={role} variant="info">{ROLE_OPTIONS.find(r => r.value === role)?.label ?? role}</Badge>
                ))}
              </div>
            )}
            <p className="text-xs font-display text-text-secondary">
              {assignees.length ? assignees.join(', ') : 'No assignees selected'}
            </p>
            {proofRequired.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-dashed border-border/60">
                {proofRequired.map(p => (
                  <Badge key={p} variant="outline">{PROOF_OPTIONS.find(o => o.value === p)?.label ?? p}</Badge>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
          <AlertCircle size={15} />
          {submitError}
        </div>
      )}

      <div className="flex flex-col items-start gap-2 pt-2">
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="gap-1.5 rounded-lg bg-primary-700 hover:bg-primary-800 active:bg-primary-900 focus-visible:ring-primary-500"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? 'Save changes' : 'Create checklist'}
        </Button>
        {!canSubmit && incompleteLabels.length > 0 && (
          <p className="text-xs font-display text-text-muted">
            Complete {incompleteLabels.join(', ')} before {isEditing ? 'saving' : 'creating'} this checklist.
          </p>
        )}
      </div>
    </div>
  );
};
