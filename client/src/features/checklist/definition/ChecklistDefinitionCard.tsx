import { Link } from 'react-router';
import {
  Store, Clock, Star, CheckCircle2, Shield, AlertTriangle, Hash, ShieldCheck, Calendar,
  Camera, MapPin, PenLine, Wallet, ScanLine, type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RECURRENCE_LABEL } from '../checklistDisplay';
import type { ChecklistDefinition, ChecklistIcon, ChecklistAssigneeRole, ChecklistItemType } from '../../../api/checklistDefinitions';

interface ChecklistDefinitionCardProps {
  definition: ChecklistDefinition;
}

const ICON_BY_KEY: Record<ChecklistIcon, LucideIcon> = {
  store: Store,
  clock: Clock,
  star: Star,
  check: CheckCircle2,
  shield: Shield,
  'alert-triangle': AlertTriangle,
  hash: Hash,
  'shield-check': ShieldCheck,
  calendar: Calendar,
};

const ROLE_LABEL: Record<ChecklistAssigneeRole, string> = {
  STORE_MANAGER: 'Store Manager',
  FLOOR_MANAGER: 'Floor Manager',
  CASHIER: 'Cashier',
  SECURITY: 'Security',
  HOUSEKEEPING: 'Housekeeping',
  OPERATIONS: 'Operations',
};

// One tag per distinctive item type present on the checklist — evaluated in this fixed order so
// the card's tag row is stable across re-renders instead of following object key order.
const TAG_BY_ITEM_TYPE: Partial<Record<ChecklistItemType, string>> = {
  GPS: 'GPS',
  SIGNATURE: 'Signature',
  DUAL_SIGNATURE: 'Dual signature',
  CASH_TALLY: 'Cash tally',
  RATING: 'Rating',
  QR_SCAN: 'QR scan',
};

const TAG_ICON_BY_LABEL: Record<string, LucideIcon> = {
  'Photo proof': Camera,
  GPS: MapPin,
  Signature: PenLine,
  'Dual signature': PenLine,
  'Cash tally': Wallet,
  'QR scan': ScanLine,
};

const cardTags = (definition: ChecklistDefinition) => {
  const tags: string[] = [];
  if (definition.items.some(i => i.requiredImageCount > 0)) tags.push('Photo proof');
  for (const [itemType, label] of Object.entries(TAG_BY_ITEM_TYPE)) {
    if (definition.items.some(i => i.itemType === itemType)) tags.push(label);
  }
  return tags;
};

// Card in the Templates grid — mirrors the reference design's icon/status/tag-chip/footer layout.
export const ChecklistDefinitionCard = ({ definition }: ChecklistDefinitionCardProps) => {
  const Icon = ICON_BY_KEY[definition.icon];
  const tags = cardTags(definition);
  const roleLabel = definition.assigneeRoles[0] ? ROLE_LABEL[definition.assigneeRoles[0]] : null;

  return (
    <Link
      to={`/admin/scheduled-checklists/${definition.id}`}
      className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-border-hover transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-coral-500/15 text-coral-600 dark:text-coral-400 shrink-0">
          <Icon size={18} />
        </div>
        <Badge variant={definition.isActive ? 'success' : 'neutral'}>
          {definition.isActive ? 'Live' : 'Draft'}
        </Badge>
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-text leading-snug">{definition.name}</h3>
        <p className="text-xs font-display text-text-muted">
          {RECURRENCE_LABEL[definition.recurrence]}
          {roleLabel ? ` · ${roleLabel}` : ''}
        </p>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => {
            const TagIcon = TAG_ICON_BY_LABEL[tag];
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-hover text-text-secondary text-[11px] font-display font-medium"
              >
                {TagIcon && <TagIcon size={11} />}
                {tag}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-xs font-display text-text-muted pt-3 border-t border-border/60 mt-auto">
        <span>{definition.items.length} question{definition.items.length !== 1 ? 's' : ''}</span>
        <span>{definition.storeIds.length} store{definition.storeIds.length !== 1 ? 's' : ''}</span>
        <span>v{definition.version}</span>
      </div>
    </Link>
  );
};
