
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { es } from 'date-fns/locale';

interface DashboardCalendarProps {
  occupiedDates?: Date[];
}

export function DashboardCalendar({ occupiedDates = [] }: DashboardCalendarProps) {
  const [clientSideMonth, setClientSideMonth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // This ensures that the calendar's initial month is set on the client-side,
    // avoiding hydration mismatches with server-rendered content.
    setClientSideMonth(new Date());
  }, []);

  const modifiers = {
    booked: occupiedDates.filter(d => !isNaN(d.getTime())), // Filter out invalid dates
  };

  const modifiersStyles = {
    booked: {
      fontWeight: 'bold',
      color: 'hsl(var(--destructive-foreground))',
      backgroundColor: 'hsl(var(--destructive))',
      opacity: 0.8,
      borderRadius: 'var(--radius)',
    }
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
      month={clientSideMonth}
      onMonthChange={setClientSideMonth}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      disabled={occupiedDates} // Disables selection of occupied dates
      locale={es}
      className="p-0 rounded-md border shadow-sm mx-auto"
      classNames={{
        caption_label: "text-base font-medium",
        head_cell: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
        cell: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
        day: "w-8 h-8 sm:w-9 sm:h-9",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
      }}
    />
  );
}
