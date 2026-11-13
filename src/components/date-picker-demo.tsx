"use client";

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn, hoyEnUruguay, parseUruguayDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerDemoProps {
  selectedDate?: Date;
  onDateChange: (date?: Date) => void;
  className?: string;
  disabled?: Date[] | boolean;
  desdeHoy?: boolean;
}

export function DatePickerDemo({ selectedDate, onDateChange, className, disabled, desdeHoy }: DatePickerDemoProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);

  React.useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const hoyUruguay = React.useMemo(() => {
    const d = parseUruguayDate(hoyEnUruguay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDisabled = React.useMemo(() => {
    if (disabled === true) return true;
    if (!desdeHoy) return disabled;
    if (Array.isArray(disabled)) return [{ before: hoyUruguay }, ...disabled];
    return { before: hoyUruguay };
  }, [disabled, desdeHoy, hoyUruguay]);

  const handleSelect = (newDate?: Date) => {
    setDate(newDate);
    onDateChange(newDate);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal text-base p-3 h-auto",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled === true}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={es}
          disabled={calendarDisabled}
        />
      </PopoverContent>
    </Popover>
  )
}
