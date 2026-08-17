'use client';

import React, { useMemo } from 'react';
import { Flame, Snowflake, Zap, Sparkles, TrendingUp, Music, Camera } from 'lucide-react';
import type { SongRequest } from '@/types/social-gallery';

interface FiestaThermometerProps {
  requests: SongRequest[];
  photosCount?: number;
  recentPhotosCount?: number;
  className?: string;
}

export function FiestaThermometer({
  requests,
  photosCount = 0,
  recentPhotosCount = 0,
  className = '',
}: FiestaThermometerProps) {
  const { score, status, advice, colorClass, bgClass, icon: StatusIcon } = useMemo(() => {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;

    // Calcular canciones votadas o pedidas en los últimos 15 min
    const recentSongs = requests.filter((r) => {
      const time = r.timestamp ? new Date(r.timestamp).getTime() : 0;
      return time > fifteenMinutesAgo || (r.votes && r.votes > 1);
    });

    const totalRecentActivity = recentSongs.length * 3 + recentPhotosCount * 4 + requests.reduce((acc, r) => acc + (r.votes || 0), 0);

    let calculatedScore = Math.min(100, Math.max(15, totalRecentActivity * 4));
    if (requests.length === 0 && photosCount === 0) calculatedScore = 20;

    if (calculatedScore < 35) {
      return {
        score: calculatedScore,
        status: 'Pista Tranquila',
        advice: 'Tirá un clásico rompehielos o activá una tanda de cumbia/reggaetón para levantar.',
        colorClass: 'text-sky-400',
        bgClass: 'bg-sky-500/20 border-sky-500/30',
        icon: Snowflake,
      };
    }

    if (calculatedScore < 70) {
      return {
        score: calculatedScore,
        status: 'Ambiente en Calentamiento',
        advice: 'Buen flujo de pedidos. La pista está tomando calor, subí la intensidad.',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/20 border-amber-500/30',
        icon: Zap,
      };
    }

    return {
      score: calculatedScore,
      status: '¡Fiesta en Llamas!',
      advice: 'Máxima energía. Clavá los temas más votados de la lista y no bajes los graves.',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/20 border-rose-500/30',
      icon: Flame,
    };
  }, [requests, photosCount, recentPhotosCount]);

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-md ${bgClass} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${colorClass} animate-pulse`} />
          <span className={`text-xs font-black uppercase tracking-wider ${colorClass}`}>
            Termómetro de la Fiesta: {status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm font-black text-white">{score}%</span>
          <span className="text-[10px] text-zinc-400">energía</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900/80 mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            score < 35 ? 'bg-sky-500' : score < 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-xs text-zinc-300 font-medium leading-snug">
        💡 <strong className="text-white">Tip DJ:</strong> {advice}
      </p>
    </div>
  );
}
