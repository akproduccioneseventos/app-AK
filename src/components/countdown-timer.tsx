
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming these are used in a broader context or were part of an older version, not strictly needed for the timer divs
import { TimerIcon } from 'lucide-react'; // Assuming this is used, otherwise can be removed

interface CountdownTimerProps {
  targetDate?: string; // ISO date string
}

interface TimeLeft {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  ended?: boolean;
  message?: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null); // Initialize to null

  const calculateTimeLeft = useCallback((): TimeLeft => {
    if (!targetDate) {
      return { message: 'Fecha del evento no definida.' };
    }

    const dateObj = new Date(targetDate);
    if (isNaN(dateObj.getTime())) { // Check if date is valid
      return { message: 'Fecha del evento inválida.' };
    }

    const difference = +dateObj - +new Date(); // new Date() is fine here as it's within useEffect or subsequent calls from interval
    let newTimeLeft: TimeLeft = {};

    if (difference <= 0) {
      newTimeLeft = { ended: true, message: '¡El evento ya ha comenzado o ha pasado!' };
    } else {
      newTimeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return newTimeLeft;
  }, [targetDate]);

  useEffect(() => {
    // This effect runs only on the client, ensuring `new Date()` matches the user's clock
    // Calculate and set initial time left on client mount
    setTimeLeft(calculateTimeLeft());

    // Set up interval to update time left every second
    const timerId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timerId);
  }, [calculateTimeLeft]);


  // Loading state or initial message before first client-side calculation
  if (timeLeft === null) {
    return (
        <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">Calculando tiempo restante...</p>
        </div>
    );
  }

  if (timeLeft.ended || timeLeft.message) {
    return (
        <div className="text-center py-2">
            <p className={timeLeft.ended ? "font-semibold text-primary" : "text-sm text-muted-foreground"}>{timeLeft.message}</p>
        </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-center">
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.days || 0).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Días</div>
        </div>
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.hours || 0).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Horas</div>
        </div>
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.minutes || 0).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Minutos</div>
        </div>
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.seconds || 0).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Segundos</div>
        </div>
    </div>
  );
}
