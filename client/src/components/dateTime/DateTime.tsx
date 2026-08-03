"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Calendar as CalendarIcon, AlertCircle, type LucideIcon } from "lucide-react";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeading,
  NavButton
} from "@/components/vendor/tailgrids/core/calendar";
import { DateInput, DateSegment } from "@/components/vendor/tailgrids/core/date-field";
import {
  DatePicker,
  DatePickerGroup,
  DatePickerPopover,
  DatePickerTrigger
} from "@/components/vendor/tailgrids/core/date-picker";
import { FieldDescription, FieldLabel } from "@/components/vendor/tailgrids/core/field";

export interface DateFieldProps {
  id?: string;
  label: ReactNode;
  /** ISO date string ('YYYY-MM-DD'), or '' for no value. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description?: ReactNode;
  minDate?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export const DateField = ({
  id, label, value, onChange, error, description, minDate, disabled, className, labelClassName,
  icon: Icon, iconClassName,
}: DateFieldProps) => {
  const calendarValue = value ? parseDate(value) : null;
  const minValue = minDate ? parseDate(minDate) : undefined;

  // Manually control the open state so we can trigger it from anywhere inside the input
  const [isOpen, setIsOpen] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<Element | undefined>(undefined);
  
  useEffect(() => {
    setPortalContainer(anchorRef.current?.closest('[role="dialog"]') ?? undefined);
  }, []);

  return (
    <div ref={anchorRef} className={cn("group/field flex flex-col w-full", className)}>
      <DatePicker
        id={id}
        value={calendarValue}
        onChange={(v) => onChange(v ? v.toString() : "")}
        minValue={minValue}
        invalid={!!error}
        disabled={disabled}
        isOpen={isOpen} // Bind the open state
        onOpenChange={setIsOpen} // Allow the component to close it automatically
        className="flex flex-col w-full"
      >
        <FieldLabel 
          className={cn(
            "text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 select-none transition-colors duration-200 ease-in-out group-focus-within/field:text-gray-700",
            labelClassName
          )}
        >
          {Icon && (
            <Icon 
              className={cn(
                "w-3.5 h-3.5 transition-colors duration-200 ease-in-out group-focus-within/field:text-blue-500", 
                iconClassName
              )} 
            />
          )}
          {label}
        </FieldLabel>

        {/* Added onClick here so clicking ANYWHERE in the box opens the calendar */}
        <DatePickerGroup 
          onClick={() => setIsOpen(true)}
          className="flex items-center w-full h-10 px-3 bg-white border border-gray-300 rounded shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-text"
        >
          {/* Aggressively strip all borders and rings using !important and data-attributes to override the vendor library's internal focus states */}
          <DateInput className="flex-1 flex items-center text-sm font-medium text-gray-900 !bg-transparent !border-0 !ring-0 !outline-none !shadow-none data-[focus-within]:!ring-0 data-[focus-within]:!border-transparent focus-within:!ring-0">
            {segment => (
              <DateSegment 
                segment={segment} 
                className="px-0.5 rounded focus:bg-blue-600 focus:text-white outline-none focus-visible:ring-0" 
              />
            )}
          </DateInput>
          
          <DatePickerTrigger className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 -mr-1 p-1">
            <CalendarIcon className="w-4 h-4" />
          </DatePickerTrigger>
        </DatePickerGroup>

        {/* Upgraded error state to match the application's red badge style */}
        {error ? (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-700 bg-red-50 w-fit px-2 py-0.5 rounded border border-red-200 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={12} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : description ? (
          <FieldDescription className="mt-1.5 text-xs text-gray-500">
            {description}
          </FieldDescription>
        ) : null}

        {/* Upgraded calendar popover styling */}
        <DatePickerPopover UNSTABLE_portalContainer={portalContainer} className="bg-white border-gray-200 shadow-lg rounded-xl z-50">
          <Calendar>
            <CalendarHeader>
              <NavButton slot="previous" className="hover:bg-gray-100 text-gray-600 transition-colors" />
              <CalendarHeading className="font-semibold text-gray-900" />
              <NavButton slot="next" className="hover:bg-gray-100 text-gray-600 transition-colors" />
            </CalendarHeader>
            <CalendarGrid>
              <CalendarGridHeader className="text-xs font-bold text-gray-400 uppercase tracking-wider" />
              <CalendarGridBody>
                {date => (
                  <CalendarCell 
                    date={date} 
                    className="hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-md transition-colors data-[selected]:bg-blue-600 data-[selected]:text-white" 
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </DatePickerPopover>
      </DatePicker>
    </div>
  );
};