"use client";

import { cn } from "@/lib/utils";
import {
  Label as AriaLabel,
  Text as AriaText,
  type LabelProps as AriaLabelProps,
  type TextProps as AriaTextProps
} from "react-aria-components";

export interface FieldLabelProps extends AriaLabelProps {}

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <AriaLabel
      className={cn("mb-1.5 block text-sm font-display font-medium text-text-secondary", className)}
      {...props}
    />
  );
}

export interface FieldDescriptionProps extends AriaTextProps {}

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <AriaText
      slot="description"
      className={cn("mt-1.5 block text-xs text-text-muted", className)}
      {...props}
    />
  );
}
