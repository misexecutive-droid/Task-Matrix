"use client";

import { cn } from "@/lib/utils";
import {
  Button as AriaButton,
  DatePicker as AriaDatePicker,
  Group as AriaGroup,
  Popover as AriaPopover,
  type ButtonProps as AriaButtonProps,
  type DatePickerProps as AriaDatePickerProps,
  type GroupProps as AriaGroupProps,
  type PopoverProps as AriaPopoverProps,
  type DateValue
} from "react-aria-components";

export interface DatePickerProps<T extends DateValue> extends Omit<
  AriaDatePickerProps<T>,
  "isDisabled" | "isReadOnly" | "isRequired" | "isInvalid"
> {
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
}

export function DatePicker<T extends DateValue>({
  children,
  disabled = false,
  readOnly = false,
  required = false,
  invalid = false,
  className,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker
      isDisabled={disabled}
      isReadOnly={readOnly}
      isRequired={required}
      isInvalid={invalid}
      className={cn("flex flex-col gap-1 w-full", className)}
      {...props}
    >
      {children}
    </AriaDatePicker>
  );
}

interface DatePickerGroupProps extends AriaGroupProps {}

export function DatePickerGroup({
  className,
  children,
  ...props
}: DatePickerGroupProps) {
  return (
    <AriaGroup className={cn("relative", className)} {...props}>
      {children}
    </AriaGroup>
  );
}

interface DatePickerTriggerProps extends AriaButtonProps {}

export function DatePickerTrigger({
  className,
  children,
  ...props
}: DatePickerTriggerProps) {
  return (
    <AriaButton
      slot="trigger"
      className={cn(
        "absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-colors hover:text-text outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-full [:where(&>svg)]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </AriaButton>
  );
}

export interface DatePickerPopoverProps extends AriaPopoverProps {}

export function DatePickerPopover({
  className,
  children,
  ...props
}: DatePickerPopoverProps) {
  return (
    <AriaPopover
      placement="bottom start"
      className={cn(
        "z-50 rounded-xl border border-border bg-surface p-3 shadow-lg outline-none",
        "data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95",
        "data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95",
        className
      )}
      {...props}
    >
      {children}
    </AriaPopover>
  );
}
