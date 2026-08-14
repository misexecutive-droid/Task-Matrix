import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../ui/dialog';

const SIZE_CLASS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  footer?: ReactNode;
  showCloseButton?: boolean;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  children: ReactNode;
}

export const Modal = ({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  footer,
  showCloseButton = true,
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  children,
}: ModalProps) => (
  <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
    <DialogContent
      showCloseButton={false}
      className={`w-[95vw] ${SIZE_CLASS[size]} p-0 flex flex-col overflow-hidden rounded max-h-[90vh] ${contentClassName}`}
    >
      <div className={`flex items-center justify-between gap-3 shrink-0 px-5 py-3.5 border-b border-border/40 ${headerClassName}`}>
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </div>

        {showCloseButton && (
          <DialogClose
            className="shrink-0 p-1.5 rounded-full text-text-light hover:text-text hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </DialogClose>
        )}
      </div>

      <div className={`flex flex-col gap-5 px-5 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className={`shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-5 py-3.5 bg-surface-hover/40 border-t border-border/40 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </DialogContent>
  </Dialog>
);
