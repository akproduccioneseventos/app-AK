
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardCalendar() {
  const [clientSideMonth, setClientSideMonth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setClientSideMonth(new Date());
  }, []);

  if (!clientSideMonth) {
    // Render a skeleton placeholder matching approximate calendar size
    // The size w-[274px] h-[304px] is an estimate for the DayPicker component.
    // Adjust if needed based on actual rendered size.
    return (
      <div className="p-0 rounded-md border shadow-sm flex justify-center items-center w-[274px] h-[304px]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <Calendar
      mode="single"
      defaultMonth={clientSideMonth}
      className="p-0 rounded-md border shadow-sm"
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
