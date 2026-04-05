'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
  return {
    dias: Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    minutos: Math.floor((diff % 3600000) / 60000),
    segundos: Math.floor((diff % 60000) / 1000),
  };
}

interface PromoCountdownProps {
  fechaFin: string;
  compact?: boolean;
}

export function PromoCountdown({ fechaFin, compact = false }: PromoCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(fechaFin));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(fechaFin));
    }, 1000);
    return () => clearInterval(interval);
  }, [fechaFin]);

  const units = [
    { label: 'Días', value: timeLeft.dias },
    { label: 'Hs', value: timeLeft.horas },
    { label: 'Min', value: timeLeft.minutos },
    { label: 'Seg', value: timeLeft.segundos },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs font-mono font-black">
        {units.map((u, i) => (
          <span key={u.label}>
            <span className="bg-white/20 rounded px-1 py-0.5">
              {String(u.value).padStart(2, '0')}
            </span>
            {i < 3 && <span className="mx-0.5 opacity-60">:</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[52px] text-center">
            <span className="text-2xl font-black font-mono text-white tabular-nums">
              {String(u.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
