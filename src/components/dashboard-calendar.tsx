
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCalendarProps {
  eventDate?: Date;
}

export function DashboardCalendar({ eventDate }: DashboardCalendarProps) {
  const [clientSideMonth, setClientSideMonth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setClientSideMonth(eventDate || new Date());
  }, [eventDate]);

  const modifiers = eventDate ? { booked: [eventDate] } : {};
  const modifiersStyles = eventDate ? {
    booked: {
      fontWeight: 'bold',
      color: 'hsl(var(--primary-foreground))',
      backgroundColor: 'hsl(var(--primary))',
      borderRadius: 'var(--radius)',
    }
  } : {};

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
      selected={eventDate} // Can also be used to show the date as selected
      defaultMonth={clientSideMonth}
      month={clientSideMonth} // Control the displayed month
      onMonthChange={setClientSideMonth} // Allow user to navigate months
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      className="p-0 rounded-md border shadow-sm mx-auto" // Added mx-auto for centering
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
