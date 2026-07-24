"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  Heading as AriaHeading,
  type ButtonProps as AriaButtonProps,
  type CalendarCellProps as AriaCalendarCellProps,
  type CalendarGridProps as AriaCalendarGridProps,
  type CalendarProps as AriaCalendarProps,
  type DateValue
} from "react-aria-components";

export interface CalendarProps<T extends DateValue> extends AriaCalendarProps<T> {}

export function Calendar<T extends DateValue>({ className, ...props }: CalendarProps<T>) {
  return <AriaCalendar className={cn("w-fit", className)} {...props} />;
}

export interface CalendarHeaderProps {
  className?: string;
  children: ReactNode;
}

export function CalendarHeader({ className, children }: CalendarHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between gap-2 pb-3", className)}>
      {children}
    </header>
  );
}

export function CalendarHeading({ className }: { className?: string }) {
  return <AriaHeading className={cn("text-sm font-display font-semibold text-text", className)} />;
}

export interface NavButtonProps extends AriaButtonProps {}

export function NavButton({ className, slot, ...props }: NavButtonProps) {
  return (
    <AriaButton
      slot={slot}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-text-muted outline-none transition-colors",
        "hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-primary-500/40",
        "disabled:pointer-events-none disabled:opacity-30",
        className
      )}
      {...props}
    >
      {slot === "previous" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </AriaButton>
  );
}

export interface CalendarGridProps extends AriaCalendarGridProps {}

export function CalendarGrid({ className, ...props }: CalendarGridProps) {
  return <AriaCalendarGrid className={cn("w-full border-collapse", className)} {...props} />;
}

export function CalendarGridHeader() {
  return (
    <AriaCalendarGridHeader>
      {day => (
        <AriaCalendarHeaderCell className="pb-1 text-xs font-display font-medium text-text-light">
          {day}
        </AriaCalendarHeaderCell>
      )}
    </AriaCalendarGridHeader>
  );
}

export const CalendarGridBody = AriaCalendarGridBody;

export interface CalendarCellProps extends AriaCalendarCellProps {}

export function CalendarCell({ className, ...props }: CalendarCellProps) {
  return (
    <AriaCalendarCell
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-sm text-text outline-none transition-colors cursor-pointer",
        "hover:bg-surface-hover",
        "data-[today]:ring-1 data-[today]:ring-inset data-[today]:ring-primary-500",
        "data-[selected]:bg-primary-500 data-[selected]:text-white data-[selected]:hover:bg-primary-600",
        "data-[outside-month]:text-text-light/60",
        "data-[unavailable]:text-text-light data-[unavailable]:line-through",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-30",
        "focus-visible:ring-2 focus-visible:ring-primary-500/40",
        className
      )}
      {...props}
    />
  );
}
