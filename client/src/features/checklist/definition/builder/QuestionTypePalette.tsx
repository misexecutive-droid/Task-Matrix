import {
  CheckCircle2, ShieldCheck, List, ChevronDownSquare, AlignLeft, Hash, Calendar, Star,
  Camera, Video, PenLine, Users2, ScanLine, MapPin, Wallet, ClipboardCheck, SquareCheck,
  Plus, type LucideIcon,
} from 'lucide-react';
import type { ItemDraft } from '../ChecklistDefinitionItemDraftRow';

interface PaletteEntry {
  label: string;
  icon: LucideIcon;
  patch: Partial<ItemDraft>;
}

// Static catalog of every question type the Builder can add — mirrors the reference design's
// "Question Types" panel, with a few extra Task-Matrix-native types (Cash tally, Audit, Dual
// signature, plain checkbox) appended after the ones shown in the reference.
const PALETTE: PaletteEntry[] = [
  { label: 'Yes / No', icon: CheckCircle2, patch: { itemType: 'YES_NO' } },
  { label: 'Pass / Fail', icon: ShieldCheck, patch: { itemType: 'PASS_FAIL' } },
  { label: 'Multiple choice', icon: List, patch: { itemType: 'MULTIPLE_CHOICE' } },
  { label: 'Dropdown', icon: ChevronDownSquare, patch: { itemType: 'DROPDOWN' } },
  { label: 'Text box', icon: AlignLeft, patch: { itemType: 'TEXT_BOX' } },
  { label: 'Number entry', icon: Hash, patch: { itemType: 'NUMBER_ENTRY' } },
  { label: 'Date & time', icon: Calendar, patch: { itemType: 'DATE_TIME' } },
  { label: 'Rating 1-5', icon: Star, patch: { itemType: 'RATING', ratingScale: '5' } },
  { label: 'Photo upload', icon: Camera, patch: { itemType: 'STANDARD', requiredImageCount: '1' } },
  { label: 'Video upload', icon: Video, patch: { itemType: 'VIDEO_UPLOAD', requiredImageCount: '1' } },
  { label: 'Signature', icon: PenLine, patch: { itemType: 'SIGNATURE' } },
  { label: 'Dual signature', icon: Users2, patch: { itemType: 'DUAL_SIGNATURE' } },
  { label: 'Barcode / QR scan', icon: ScanLine, patch: { itemType: 'QR_SCAN' } },
  { label: 'GPS verification', icon: MapPin, patch: { itemType: 'GPS' } },
  { label: 'Cash tally', icon: Wallet, patch: { itemType: 'CASH_TALLY' } },
  { label: 'Audit', icon: ClipboardCheck, patch: { itemType: 'AUDIT' } },
  { label: 'Simple checkbox', icon: SquareCheck, patch: { itemType: 'STANDARD', requiredImageCount: '0' } },
];

interface QuestionTypePaletteProps {
  onAdd: (patch: Partial<ItemDraft>) => void;
}

export const QuestionTypePalette = ({ onAdd }: QuestionTypePaletteProps) => (
  <div className="flex flex-col gap-4">
    <h2 className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">Question Types</h2>
    <div className="flex flex-col gap-1.5">
      {PALETTE.map(({ label, icon: Icon, patch }) => (
        <button
          key={label}
          type="button"
          onClick={() => onAdd(patch)}
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-surface text-left text-sm font-display font-medium text-text-secondary hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 transition-all duration-150 cursor-pointer"
        >
          <Icon size={16} className="shrink-0 text-text-muted group-hover:text-primary-600 transition-colors" />
          <span className="flex-1 min-w-0 truncate">{label}</span>
          <Plus size={14} className="shrink-0 text-text-light group-hover:text-primary-600 transition-colors" />
        </button>
      ))}
    </div>
  </div>
);
