import type { ElementType } from 'react';
import { AlertCircle } from 'lucide-react';

// Shared list-page states — used identically by UserList and DepartmentList (previously each
// file had its own byte-for-byte copy of both).

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm font-display">
    <AlertCircle size={15} />
    {message}
  </div>
);

export const EmptyState = ({ label, Icon }: { label: string; Icon: ElementType }) => (
  <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2 border border-dashed border-border rounded-xl bg-surface/50">
    <Icon size={28} className="text-text-light" />
    <p className="text-sm font-display">{label}</p>
  </div>
);
