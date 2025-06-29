'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { es } from 'date-fns/esm/locale/es'; // Import Spanish locale

interface DashboardCalendarProps {
  eventDate?: string; // Changed to string to match common data source type
}

export function DashboardCalendar({ eventDate }: DashboardCalendarProps) {
  const [clientSideMonth, setClientSideMonth] = useState<Date | undefined>(undefined);
  const [parsedEventDate, setParsedEventDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    let validDate: Date | undefined = undefined;
    if (eventDate) {
      const d = new Date(eventDate);
      if (!isNaN(d.getTime())) {
        validDate = d;
      }
    }
    setParsedEventDate(validDate);
    // Initialize clientSideMonth after hydration, using eventDate if valid, else current date
    setClientSideMonth(validDate || new Date());
  }, [eventDate]);

  const modifiers = parsedEventDate ? { booked: [parsedEventDate] } : {};
  const modifiersStyles = parsedEventDate ? {
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
      selected={parsedEventDate}
      defaultMonth={clientSideMonth} // Use clientSideMonth which is set after hydration
      month={clientSideMonth} // Control the displayed month
      onMonthChange={setClientSideMonth} // Allow user to navigate months
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      locale={es} // Set locale to Spanish
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
