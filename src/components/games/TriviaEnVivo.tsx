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
  onResponder: (optionId: string) => void;
}

/**
 * Trivia en vivo, como Kahoot: el celular muestra LA pregunta lanzada y un toque es una respuesta.
 * No calcula puntos ni sabe la respuesta correcta antes de que la pantalla la revele.
 */
export default function TriviaEnVivo({ game, respuesta, puntosTotales, enviando, mensaje, accentColor = '#7c3aed', onResponder }: Props) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const revelada = Boolean(game.correctOptionId) || Boolean(game.isFinished);
  const segundos = Math.max(0, SEGUNDOS_PARA_RESPONDER - Math.floor((ahora - Date.parse(game.launchedAt)) / 1000));
  const sinTiempo = segundos <= 0;
  const acerto = Boolean(respuesta) && Boolean(game.correctOptionId) && respuesta?.optionId === game.correctOptionId;
  const puedeResponder = !respuesta && !revelada && !sinTiempo;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-violet-600">Trivia en vivo</p>
      <h2 className="mt-1 text-2xl font-black leading-tight text-slate-900">{game.title}</h2>
      {game.subtitle && <p className="mt-1 text-sm text-slate-600">{game.subtitle}</p>}

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
              onClick={() => onResponder(option.id)}
              className={`min-h-16 w-full rounded-xl border-2 px-4 py-3 text-left text-lg font-black transition ${
                esCorrecta
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : elegida
                    ? 'border-violet-500 bg-violet-50 text-violet-900'
                    : 'border-slate-200 bg-white text-slate-900'
              } disabled:cursor-default`}
              style={puedeResponder ? { borderColor: accentColor } : undefined}
            >
              {option.emoji && <span className="mr-2">{option.emoji}</span>}
              {option.text}
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
