'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, type CalendarProps } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { es } from 'react-day-picker/locale';

interface DashboardCalendarProps extends Omit<Extract<CalendarProps, { mode: 'single'; required?: false }>, 'mode' | 'selected' | 'onSelect'> {
  occupiedDates?: Date[];
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

export function DashboardCalendar({ occupiedDates = [], ...props }: DashboardCalendarProps) {
  const [clientSideMonth, setClientSideMonth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setClientSideMonth(new Date());
  }, []);

  const modifiers = {
    booked: occupiedDates.filter(d => !isNaN(d.getTime())), // Filter out invalid dates
    ...props.modifiers
  };

  const modifiersStyles = {
    booked: {
      fontWeight: 'bold',
      color: 'hsl(var(--destructive-foreground))',
      backgroundColor: 'hsl(var(--destructive))',
      opacity: 0.8,
    },
    ...props.modifiersStyles
  };

  if (!clientSideMonth) {
    return (
      <div className="p-0 rounded-md border shadow-sm flex justify-center items-center w-full max-w-[274px] h-[304px] mx-auto">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <Calendar
      mode="single"
      defaultMonth={clientSideMonth}
      month={props.month || clientSideMonth}
      onMonthChange={props.onMonthChange || setClientSideMonth}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      locale={es}
      className="p-0 [--calendar-padding:0px] rounded-md border shadow-sm mx-auto"
      classNames={{
        caption_label: "text-base font-medium",
        weekday: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
        day: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
        day_button: "w-8 h-8 sm:w-9 sm:h-9",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
      }}
      {...props}
    />
  );
}
