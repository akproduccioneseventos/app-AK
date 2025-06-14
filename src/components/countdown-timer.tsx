
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimerIcon } from 'lucide-react';

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
  const calculateTimeLeft = useCallback((): TimeLeft => {
    if (!targetDate) {
      return { message: 'Fecha del evento no definida.' };
    }

    const dateObj = new Date(targetDate);
    if (isNaN(dateObj.getTime())) { // Check if date is valid
      return { message: 'Fecha del evento inválida.' };
    }

    const difference = +dateObj - +new Date();
    let timeLeft: TimeLeft = {};

    if (difference <= 0) {
      timeLeft = { ended: true, message: '¡El evento ya ha comenzado o ha pasado!' };
    } else {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    // Ensure targetDate is valid and not ended before starting timer
    if (!targetDate || isNaN(new Date(targetDate).getTime()) || timeLeft.ended) {
      setTimeLeft(calculateTimeLeft()); // Recalculate to show message if date is invalid/past
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, calculateTimeLeft, targetDate]);

  if (timeLeft.message) {
    return (
        <div className="text-center py-2">
            <p className={timeLeft.ended ? "font-semibold text-primary" : "text-sm text-muted-foreground"}>{timeLeft.message}</p>
        </div>
    );
  }


  return (
    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-center">
      {timeLeft.days !== undefined && timeLeft.days > 0 && (
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Días</div>
        </div>
      )}
      {timeLeft.hours !== undefined && (timeLeft.days === 0 || timeLeft.days === undefined || timeLeft.days > 0) && (
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Horas</div>
        </div>
      )}
      {timeLeft.minutes !== undefined && (
        <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Minutos</div>
        </div>
      )}
       {(timeLeft.days === undefined || timeLeft.days === 0) && (timeLeft.hours === undefined || timeLeft.hours === 0) && timeLeft.seconds !== undefined && (
         <div className="p-2 rounded-md bg-primary/10 min-w-[60px] md:min-w-[80px]">
          <div className="text-2xl md:text-3xl font-bold text-primary">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Segundos</div>
        </div>
       )}
    </div>
  );
}

