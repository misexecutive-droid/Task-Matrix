import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AdminUser } from '../../../api/admin';
import { ROLE_STYLES, ROLE_LABEL } from '../roleBadge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const initialsOf = (firstName: string, lastName?: string | null) =>
  `${firstName[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

export const UserRow = ({ user }: { user: AdminUser }) => (
  <div className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-200 hover:bg-surface-hover">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-[11px] font-display font-bold shrink-0 shadow-sm ring-1 ring-primary-500/10">
      {initialsOf(user.firstName, user.lastName)}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-display font-semibold text-text truncate">
        {user.firstName} {user.lastName ?? ''}
      </p>
      <p className="text-xs font-display text-text-muted truncate">{user.email}</p>
    </div>
    <span
      className={cn(
        'shrink-0 text-[10px] font-display font-bold px-1.5 py-0.5 rounded-md border',
        ROLE_STYLES[user.role]
      )}
    >
      {ROLE_LABEL[user.role]}
    </span>
    {!user.isActive && (
      <span className="shrink-0 text-[10px] font-display font-bold px-1.5 py-0.5 rounded-md bg-surface-hover text-text-light border border-border">
        Inactive
      </span>
    )}
  </div>
);
