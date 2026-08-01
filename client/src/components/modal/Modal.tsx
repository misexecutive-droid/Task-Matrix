import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

const SIZE_CLASS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
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
      showCloseButton={showCloseButton}
      className={`w-[95vw] ${SIZE_CLASS[size]} p-0 flex flex-col overflow-hidden ${contentClassName}`}
    >
      <DialogHeader className={`shrink-0 px-5 pt-5 pb-4 border-b border-border/40 ${headerClassName}`}>
        {icon ? (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 border border-primary-500/20 shrink-0">
              {icon}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        ) : (
          <DialogTitle>{title}</DialogTitle>
        )}
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <div className={`flex flex-col gap-5 px-5 py-4 overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <DialogFooter className={`shrink-0 px-5 py-4 border-t border-border/40 ${footerClassName}`}>
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);
