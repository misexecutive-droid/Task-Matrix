"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeading,
  NavButton
} from "@/components/tailgrids/core/calendar";
import { DateInput, DateSegment } from "@/components/tailgrids/core/date-field";
import {
  DatePicker,
  DatePickerGroup,
  DatePickerPopover,
  DatePickerTrigger
} from "@/components/tailgrids/core/date-picker";
import { FieldDescription, FieldLabel } from "@/components/tailgrids/core/field";

export const DateTimePicker = () => {
  return (
    <div className="max-w-xs w-full">
      <DatePicker>
        <FieldLabel>Appointment Date</FieldLabel>

        <DatePickerGroup>
          <DateInput>
            {segment => <DateSegment segment={segment} />}
          </DateInput>
          <DatePickerTrigger>
            <CalendarIcon className="size-4" />
          </DatePickerTrigger>
        </DatePickerGroup>

        <FieldDescription>
          Select your preferred appointment date.
        </FieldDescription>

        <DatePickerPopover>
          <Calendar>
            <CalendarHeader>
              <NavButton slot="previous" />
              <CalendarHeading />
              <NavButton slot="next" />
            </CalendarHeader>
            <CalendarGrid>
              <CalendarGridHeader />
              <CalendarGridBody>
                {date => <CalendarCell date={date} />}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </DatePickerPopover>
      </DatePicker>
    </div>
  );
};
