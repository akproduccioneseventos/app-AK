'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSongRequests, markSongPlayed, voteSongRequest } from '@/app/actions/social-interactive';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { SongRequest } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Music, RefreshCw, ThumbsUp, Volume2, VolumeX, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const REFRESH_INTERVAL_MS = 5000;

export default function DJPage({ params }: { params: { fiestaId: string } }) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayed, setShowPlayed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [songs, fiestaData] = await Promise.all([
        getSongRequests(params.fiestaId),
        getFiestaById(params.fiestaId),
      ]);
      // Sort: unplayed first (by votes), then played (by votes)
      const sorted = [...songs].sort((a, b) => {
        if (a.played !== b.played) return a.played ? 1 : -1;
        return b.votes - a.votes;
      });
      setRequests(sorted);
      setFiesta(fiestaData);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [params.fiestaId]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkPlayed = async (req: SongRequest) => {
    setActionLoading(req.id);
    await markSongPlayed(params.fiestaId, req.id);
    await fetchData(false);
    setActionLoading(null);
  };

  const handleVote = async (req: SongRequest) => {
    setActionLoading(req.id + '_vote');
    await voteSongRequest(params.fiestaId, req.id);
    await fetchData(false);
    setActionLoading(null);
  };

  const unplayed = requests.filter(r => !r.played);
  const played = requests.filter(r => r.played);
  const displayed = showPlayed ? requests : unplayed;
  const eventName = fiesta?.configuracion.nombreEvento ?? 'Evento';

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4">
        <div className="max-w-2xl mx-auto h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Music className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-base leading-tight truncate">🎧 Panel DJ</h1>
              <p className="text-[11px] text-zinc-400 truncate">{eventName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPlayed(v => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors',
                showPlayed
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
              )}
            >
              {showPlayed ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {showPlayed ? 'Ver todas' : 'Solo pendientes'}
            </button>
            <button
              onClick={() => fetchData(false)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
              aria-label="Actualizar"
            >
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>
            <span className="text-emerald-400 font-bold text-sm">{unplayed.length}</span> pendientes
          </span>
          <span>
            <span className="text-zinc-400 font-bold text-sm">{played.length}</span> reproducidas
          </span>
        </div>
        <span className="text-zinc-600">
          Actualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })}
        </span>
      </div>

      {/* Song list */}
      <main className="max-w-2xl mx-auto px-4 pb-10 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">🎵</div>
            <p className="font-bold text-zinc-400">
              {showPlayed ? 'No hay pedidos aún' : 'No hay pedidos pendientes'}
            </p>
            <p className="text-sm text-zinc-600">
              Los pedidos de los invitados aparecen aquí automáticamente.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {displayed.map((req, idx) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl border transition-all',
                  req.played
                    ? 'bg-zinc-900/40 border-zinc-800 opacity-50'
                    : idx === 0 && !showPlayed
                    ? 'bg-emerald-950/60 border-emerald-800/60 shadow-lg shadow-emerald-950/40'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
                )}
              >
                {/* Position number */}
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black',
                  req.played ? 'bg-zinc-800 text-zinc-600' : idx === 0 ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400',
                )}>
                  {req.played ? '✓' : idx + 1}
                </div>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-bold text-base leading-tight truncate',
                    req.played ? 'line-through text-zinc-500' : 'text-white',
                  )}>
                    {req.song}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-zinc-500 truncate">Pedido por {req.requestedBy}</p>
                    <span className="text-zinc-700">·</span>
                    <p className="text-xs text-zinc-600 shrink-0">
                      {formatDistanceToNow(new Date(req.timestamp), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>

                {/* Vote count */}
                <button
                  onClick={() => !req.played && handleVote(req)}
                  disabled={!!actionLoading || req.played}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors',
                    req.played
                      ? 'text-zinc-700 cursor-not-allowed'
                      : 'text-emerald-400 hover:bg-emerald-500/10 active:scale-95',
                  )}
                  aria-label="Votar esta canción"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-xs font-black">{req.votes}</span>
                </button>

                {/* Mark played button */}
                <button
                  onClick={() => handleMarkPlayed(req)}
                  disabled={actionLoading === req.id}
                  className={cn(
                    'flex-shrink-0 p-2.5 rounded-xl transition-all active:scale-95',
                    req.played
                      ? 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                  )}
                  aria-label={req.played ? 'Marcar como no reproducida' : 'Marcar como reproducida'}
                  title={req.played ? 'Desmarcar' : 'Marcar como reproducida'}
                >
                  {actionLoading === req.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : req.played ? (
                    <Circle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* Live indicator */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-full border border-zinc-800 shadow-xl">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-zinc-400">EN VIVO · actualización automática</span>
      </div>
    </div>
  );
}
