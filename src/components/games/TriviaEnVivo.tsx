'use client';

import React, { useEffect, useState } from 'react';
import type { ActiveGameData } from '@/types/fiesta';
import { SEGUNDOS_PARA_RESPONDER } from '@/lib/games/juegos-en-vivo';

interface Props {
  /** La pregunta que lanzó el operador (sin la respuesta correcta hasta que se revele). */
  game: ActiveGameData;
  /** Lo que el servidor sabe de este jugador: qué contestó y cuántos puntos lleva. */
  respuesta?: { optionId: string; puntos: number };
  puntosTotales: number;
  enviando?: boolean;
  mensaje?: string;
  accentColor?: string;
  mesaInicial?: string;
  fiestaId?: string;
  onResponder: (optionId: string, tableNumber?: string) => void;
}

/**
 * Trivia en vivo, como Kahoot: el celular muestra LA pregunta lanzada y un toque es una respuesta.
 * No calcula puntos ni sabe la respuesta correcta antes de que la pantalla la revele.
 */
export default function TriviaEnVivo({
  game,
  respuesta,
  puntosTotales,
  enviando,
  mensaje,
  accentColor = '#7c3aed',
  mesaInicial,
  fiestaId,
  onResponder,
}: Props) {
  const [ahora, setAhora] = useState(() => Date.now());
  const storageKey = fiestaId ? `trivia_mesa_${fiestaId}` : 'trivia_mesa_invitado';

  const [mesa, setMesa] = useState<string>(() => {
    if (mesaInicial) return mesaInicial;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || '';
    }
    return '';
  });
  const [editandoMesa, setEditandoMesa] = useState<boolean>(false);
  const [borradorMesa, setBorradorMesa] = useState<string>(mesa);

  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mesaInicial && !mesa) {
      setMesa(mesaInicial);
      setBorradorMesa(mesaInicial);
    }
  }, [mesaInicial, mesa]);

  const guardarMesa = (nuevaMesa: string) => {
    const limpia = nuevaMesa.trim().slice(0, 30);
    setMesa(limpia);
    setBorradorMesa(limpia);
    setEditandoMesa(false);
    if (typeof window !== 'undefined') {
      if (limpia) {
        localStorage.setItem(storageKey, limpia);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  };

  const revelada = Boolean(game.correctOptionId) || Boolean(game.isFinished);
  const segundos = Math.max(0, SEGUNDOS_PARA_RESPONDER - Math.floor((ahora - Date.parse(game.launchedAt)) / 1000));
  const sinTiempo = segundos <= 0;
  const acerto = Boolean(respuesta) && Boolean(game.correctOptionId) && respuesta?.optionId === game.correctOptionId;
  const puedeResponder = !respuesta && !revelada && !sinTiempo;

  const esQuienLoDijo =
    game.title?.toLowerCase().includes('quién lo dijo') ||
    game.title?.toLowerCase().includes('quien lo dijo') ||
    game.subtitle?.toLowerCase().includes('quién lo dijo') ||
    game.subtitle?.toLowerCase().includes('quien lo dijo');

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-widest text-violet-600">Trivia en vivo</p>
        {esQuienLoDijo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-pink-700">
            🎯 ¿Quién lo dijo?
          </span>
        )}
      </div>

      <h2 className="mt-1 text-2xl font-black leading-tight text-slate-900">{game.title}</h2>
      {game.subtitle && <p className="mt-1 text-sm text-slate-600">{game.subtitle}</p>}

      {/* Soporte de juego por mesas */}
      {mesa && !editandoMesa ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🏷️</span>
            <p className="text-xs font-bold text-violet-950">
              Jugando por <span className="font-black text-violet-700">Mesa {mesa}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBorradorMesa(mesa);
              setEditandoMesa(true);
            }}
            className="text-xs font-black text-violet-600 underline hover:text-violet-800"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">👥</span>
            <p className="text-xs font-bold text-amber-950">
              Elegí tu mesa para sumar puntos en equipo
            </p>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={borradorMesa}
              onChange={(e) => setBorradorMesa(e.target.value)}
              placeholder="Ej: Mesa 4"
              maxLength={30}
              className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => guardarMesa(borradorMesa)}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
            >
              Guardar
            </button>
            {mesa && (
              <button
                type="button"
                onClick={() => setEditandoMesa(false)}
                className="px-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {puedeResponder && (
        <p className="mt-3 text-sm font-bold text-slate-700" aria-live="polite">Te quedan {segundos} segundos</p>
      )}

      <div className="mt-4 grid gap-3">
        {(game.options || []).map((option) => {
          const elegida = respuesta?.optionId === option.id;
          const esCorrecta = revelada && option.id === game.correctOptionId;
          return (
            <button
              key={option.id}
              type="button"
              disabled={!puedeResponder || enviando}
              onClick={() => onResponder(option.id, mesa.trim() || undefined)}
              className={`min-h-16 w-full rounded-2xl border-2 px-4 py-3.5 text-left font-black transition ${
                esCorrecta
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md'
                  : elegida
                    ? 'border-violet-500 bg-violet-50 text-violet-900 shadow-md ring-2 ring-violet-400'
                    : esQuienLoDijo
                      ? 'border-pink-200 bg-gradient-to-r from-pink-50/60 to-purple-50/40 text-slate-900 shadow-sm hover:border-pink-400 hover:bg-pink-50/80'
                      : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300'
              } disabled:cursor-default`}
              style={puedeResponder && !esCorrecta && !elegida && !esQuienLoDijo ? { borderColor: accentColor } : undefined}
            >
              <div className="flex items-center gap-3">
                {option.emoji && (
                  <span
                    className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 ${
                      esQuienLoDijo ? 'h-11 w-11 text-2xl' : 'h-9 w-9 text-lg'
                    }`}
                  >
                    {option.emoji}
                  </span>
                )}
                <span className={`min-w-0 flex-1 leading-snug ${esQuienLoDijo ? 'text-xl font-black text-slate-900' : 'text-lg font-black text-slate-900'}`}>
                  {option.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-1 text-center" aria-live="polite">
        {mensaje && <p className="text-sm font-bold text-rose-600">{mensaje}</p>}
        {respuesta && !revelada && <p className="text-lg font-black text-violet-700">Respuesta enviada</p>}
        {respuesta && revelada && (
          <p className={`text-lg font-black ${acerto ? 'text-emerald-700' : 'text-rose-600'}`}>
            {acerto ? `¡Acertaste! +${respuesta.puntos} puntos` : 'No acertaste esta vez'}
          </p>
        )}
        {!respuesta && revelada && <p className="text-lg font-black text-slate-700">Esta pregunta ya cerró</p>}
        {!respuesta && !revelada && sinTiempo && <p className="text-lg font-black text-slate-700">Se acabó el tiempo</p>}
        <p className="text-sm font-bold text-slate-600">Tu puntaje: {puntosTotales}</p>
        {game.isFinished && <p className="text-sm text-slate-500">La trivia terminó. Mirá el podio en la pantalla grande.</p>}
      </div>
    </div>
  );
}
