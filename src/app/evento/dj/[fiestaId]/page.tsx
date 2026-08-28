'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getSongRequests, markSongPlayed, voteSongRequest } from '@/app/actions/social-interactive';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { SongRequest } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Music, RefreshCw, ThumbsUp, Volume2, VolumeX, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FiestaThermometer } from '@/components/fiesta/FiestaThermometer';
import { parsearEntradaMusica, unificarListaMusica } from '@/lib/musica/bandeja-musica';

const REFRESH_INTERVAL_MS = 5000;

export default function DJPage() {
  const params = useParams<{ fiestaId: string }>();
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
      setLoadError(false);
    } catch (err) {
      console.error('[DJPage] fetchData error:', err);
      if (showLoader) setLoadError(true);
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

  /**
   * La lista que ve el DJ: lo del cliente y lo de los invitados, junto.
   *
   * Los pedidos de los invitados ya venian guardados en `cancionesDJ` de cada
   * uno, pero quedaban en otra pantalla. Se juntan aca, se agrupan los repetidos
   * y se respetan las prohibidas del cliente.
   */
  const listaUnificada = React.useMemo(() => {
    const delCliente = parsearEntradaMusica(fiesta?.musica?.playlistFiesta || '');
    const deLosInvitados = (fiesta?.invitados || []).flatMap((invitado: { nombre?: string; cancionesDJ?: string[] }) =>
      (invitado.cancionesDJ || []).map((cancion) => ({
        cancion,
        invitadoNombre: invitado.nombre,
      })),
    );
    return unificarListaMusica(
      delCliente,
      deLosInvitados,
      // Las prohibidas se cargan en un solo campo de texto, un tema por renglon.
      (fiesta?.musica?.listaNoReproducir || '').split('\n').map((linea: string) => linea.trim()).filter(Boolean),
      fiesta?.musica?.cancionesTortaBrindis || [],
    );
  }, [fiesta]);

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

      {/* BLOQUE FIJO: Momentos Clave y Lista del Cliente */}
      <div className="max-w-2xl mx-auto px-4 mb-4 space-y-3">
        {/* Momentos Especiales (Entrada, Vals, Torta) */}
        {(fiesta?.musica?.cancionEntrada || fiesta?.musica?.cancionVals || (fiesta?.musica?.cancionesTortaBrindis && fiesta.musica.cancionesTortaBrindis.length > 0)) ? (
          <div className="rounded-2xl border-2 border-indigo-500/60 bg-gradient-to-r from-indigo-950/70 via-zinc-900 to-purple-950/70 p-4 shadow-xl shadow-indigo-950/30">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-indigo-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h2 className="text-base sm:text-lg font-black text-indigo-300 tracking-tight">
                  MOMENTOS CLAVE DE LA FIESTA
                </h2>
              </div>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                Protocolo
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {fiesta.musica?.cancionEntrada && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-indigo-500/30">
                  <p className="text-[10px] uppercase font-black tracking-wider text-indigo-400">Entrada</p>
                  <p className="font-bold text-white truncate">{fiesta.musica.cancionEntrada}</p>
                </div>
              )}
              {fiesta.musica?.cancionVals && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/30">
                  <p className="text-[10px] uppercase font-black tracking-wider text-purple-400">Vals</p>
                  <p className="font-bold text-white truncate">{fiesta.musica.cancionVals}</p>
                </div>
              )}
              {fiesta.musica?.cancionesTortaBrindis && fiesta.musica.cancionesTortaBrindis.length > 0 && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-pink-500/30">
                  <p className="text-[10px] uppercase font-black tracking-wider text-pink-400">Torta / Brindis</p>
                  <p className="font-bold text-white truncate">{fiesta.musica.cancionesTortaBrindis.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/*
          Una sola lista, con lo del cliente y lo de los invitados junto.
          Antes esta pantalla mostraba nada mas lo que habia pegado el cliente, y
          los pedidos de los invitados quedaban en otro lado. Ahora se juntan y
          **los repetidos se agrupan**: si diez piden el mismo tema aparece una
          vez con el numero al lado, que ademas le dice al DJ que es lo que mas
          quieren.
        */}
        {listaUnificada.length > 0 ? (
          <div className="rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-teal-950/70 p-4 shadow-xl shadow-emerald-950/30">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎧</span>
                <h2 className="text-base sm:text-lg font-black text-emerald-300 tracking-tight">
                  LA MUSICA DE LA FIESTA
                </h2>
              </div>
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {listaUnificada.length} temas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {listaUnificada.map((tema, idx) => (
                <div key={`${tema.titulo}-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-emerald-500/20 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-emerald-100 truncate">{tema.titulo}</p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {tema.artista}
                      {tema.pedidosPor.length > 0 ? ` · ${tema.pedidosPor.slice(0, 2).join(', ')}` : ''}
                    </p>
                  </div>
                  {tema.repeticiones > 1 && (
                    <span className="text-[10px] font-black text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700 shrink-0">
                      x{tema.repeticiones}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 1. Infaltables / Imprescindibles */}
        {fiesta?.listaMusicaPortal?.imprescindibles && fiesta.listaMusicaPortal.imprescindibles.length > 0 ? (
          <div className="rounded-2xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-950/70 via-zinc-900 to-amber-950/70 p-4 shadow-xl shadow-amber-950/30">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h2 className="text-base sm:text-lg font-black text-amber-300 tracking-tight">
                  INFALTABLES DEL CLIENTE
                </h2>
              </div>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                {fiesta.listaMusicaPortal.imprescindibles.length} obligatorias
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fiesta.listaMusicaPortal.imprescindibles.map((cancion, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 border border-amber-500/30 hover:border-amber-400 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">
                    {idx + 1}
                  </span>
                  <span className="font-extrabold text-sm sm:text-base text-amber-100 leading-snug break-words">
                    {cancion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 2. Prohibidas / No Deben Sonar */}
        {fiesta?.listaMusicaPortal?.noQuiero && fiesta.listaMusicaPortal.noQuiero.length > 0 ? (
          <div className="rounded-2xl border-2 border-rose-600/80 bg-gradient-to-r from-rose-950/80 via-zinc-900 to-rose-950/80 p-4 shadow-xl shadow-rose-950/30">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-rose-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚫</span>
                <h2 className="text-base sm:text-lg font-black text-rose-300 tracking-tight">
                  PROHIBIDAS — NO REPRODUCIR
                </h2>
              </div>
              <span className="text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                {fiesta.listaMusicaPortal.noQuiero.length} vetadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fiesta.listaMusicaPortal.noQuiero.map((cancion, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/50 border border-rose-500/30 hover:border-rose-400 transition-colors"
                >
                  <span className="flex-shrink-0 text-rose-500 font-bold text-sm">✕</span>
                  <span className="font-bold text-sm sm:text-base text-rose-200 line-through leading-snug break-words opacity-90">
                    {cancion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Termómetro de la Fiesta en Tiempo Real */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <FiestaThermometer requests={requests} />
      </div>

      {/* Info banner */}
      <div className="max-w-2xl mx-auto px-4 mb-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-zinc-400">
          <span className="text-emerald-400 text-sm">🎛️</span>
          <span>Sugerencias del público ordenadas por votos en tiempo real. Como DJ, vos tenés el control total de la pista.</span>
        </div>
      </div>

      {/* Song list */}
      <main className="max-w-2xl mx-auto px-4 pb-10 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">⚠️</div>
            <p className="font-bold text-red-400">Error al cargar los pedidos</p>
            <button
              onClick={() => fetchData(true)}
              className="text-sm text-zinc-400 underline hover:text-zinc-200"
            >
              Reintentar
            </button>
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
