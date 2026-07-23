import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

export interface DropdownAction {
  label: string;
  // A route renders as a NavLink; omitting `to` and using `onClick` instead
  // renders a plain action button (e.g. "Sign out").
  to?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  // Draws a separator line above this item — used to set an action like
  // "Sign out" apart from the navigation links above it.
  separatorBefore?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownAction[];
  align?: 'start' | 'center' | 'end';
}

// Reusable "button that opens a menu of links/actions" — create once, used
// everywhere (Header's account menu today, any future action menu later).
// Built on shadcn's DropdownMenu (Radix) so it's themed, animated, and
// keyboard-accessible out of the box.
export const Dropdown = ({ trigger, items, align = 'end' }: DropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
    <DropdownMenuContent align={align} className="w-48">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label}>
            {item.separatorBefore && <DropdownMenuSeparator />}
            {item.to ? (
              <DropdownMenuItem asChild variant={item.variant}>
                <NavLink to={item.to} className="flex items-center gap-2 w-full">
                  {Icon && <Icon size={15} />}
                  {item.label}
                </NavLink>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={item.onClick}
                variant={item.variant}
                className="flex items-center gap-2 cursor-pointer"
              >
                {Icon && <Icon size={15} />}
                {item.label}
              </DropdownMenuItem>
            )}
          </div>
        );
      })}
    </DropdownMenuContent>
  </DropdownMenu>
);
