"use client";

import { cn } from "@/lib/utils";
import {
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  type DateInputProps as AriaDateInputProps,
  type DateSegmentProps as AriaDateSegmentProps
} from "react-aria-components";

export interface DateInputProps extends AriaDateInputProps {}

export function DateInput({ className, ...props }: DateInputProps) {
  return (
    <AriaDateInput
      className={cn(
        "flex w-full items-center rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text transition-all",
        "focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/20",
        "data-[invalid]:border-danger data-[invalid]:focus-within:ring-danger/20",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export interface DateSegmentProps extends AriaDateSegmentProps {}

export function DateSegment({ className, ...props }: DateSegmentProps) {
  return (
    <AriaDateSegment
      className={cn(
        "rounded-sm px-0.5 tabular-nums text-text outline-none",
        "focus:bg-primary-500 focus:text-white",
        "data-[placeholder]:text-text-light data-[type=literal]:px-0",
        className
      )}
      {...props}
    />
  );
}
