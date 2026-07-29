import { Trash2 } from 'lucide-react';
import { Button } from '../../../components';
import { SheetFooter } from '@/components/ui/sheet';

interface TicketDetailFooterProps {
  isAdmin: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onClose: () => void;
}

export const TicketDetailFooter = ({ isAdmin, onDelete, isDeleting, onClose }: TicketDetailFooterProps) => (
  <SheetFooter className="p-4 border-t border-border/40 bg-surface/50 flex items-center justify-between gap-2">
    {isAdmin && (
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        isLoading={isDeleting}
        className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1.5 font-display text-xs"
      >
        <Trash2 size={13} />
        Delete Ticket
      </Button>
    )}
    <Button variant="outline" size="sm" onClick={onClose} className="font-display text-xs ml-auto">
      Close
    </Button>
  </SheetFooter>
);
