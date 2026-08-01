'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * El reloj de la noche.
 *
 * Es lo primero que se mira cuando se está dirigiendo la fiesta: cuánto falta
 * para empezar, o cuánto lleva andando, y qué toca ahora. Se actualiza solo, así
 * que la pantalla del celular sirve aunque quede abierta toda la noche.
 *
 * Las fiestas cruzan la medianoche: un punto del cronograma a la "01:30" es de
 * la madrugada siguiente, no de la mañana anterior. Por eso todo lo que quede
 * antes de la hora de inicio se cuenta como del día siguiente.
 */

export type PuntoDelPrograma = { id: string; hora: string; titulo: string };

type Props = {
  fechaEvento: string;
  horaInicio?: string;
  horaFin?: string;
  programa: PuntoDelPrograma[];
};

function aMinutos(hora?: string) {
  const m = (hora || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Convierte "AAAA-MM-DD" + "HH:MM" en un momento real, sin corrimientos de zona. */
function momento(fecha: string, hora: string, sumarUnDia = false) {
  const f = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const h = aMinutos(hora);
  if (!f || h === null) return null;
  const d = new Date(Number(f[1]), Number(f[2]) - 1, Number(f[3]) + (sumarUnDia ? 1 : 0));
  d.setHours(Math.floor(h / 60), h % 60, 0, 0);
  return d;
}

function enPalabras(milisegundos: number) {
  const minutos = Math.floor(Math.abs(milisegundos) / 60000);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

export function AhoraEnVivo({ fechaEvento, horaInicio, horaFin, programa }: Props) {
  const [ahora, setAhora] = useState<Date | null>(null);

  // El reloj arranca recién en el navegador: si se calculara también en el
  // servidor, la pantalla mostraría dos horas distintas durante un instante.
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!ahora) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <p className="text-sm font-bold text-slate-400">Cargando el reloj de la noche…</p>
      </div>
    );
  }

  const inicioMin = aMinutos(horaInicio) ?? 21 * 60;
  const inicio = momento(fechaEvento, horaInicio || '21:00');
  const fin = horaFin ? momento(fechaEvento, horaFin, (aMinutos(horaFin) ?? 0) < inicioMin) : null;

  let titular = 'Sin hora de inicio cargada';
  let detalle = 'Cargá la hora en la configuración de la fiesta.';

  if (inicio) {
    const faltan = inicio.getTime() - ahora.getTime();
    if (faltan > 0) {
      titular = `Faltan ${enPalabras(faltan)}`;
      detalle = `Arranca a las ${horaInicio}`;
    } else if (fin && ahora.getTime() > fin.getTime()) {
      titular = 'La fiesta terminó';
      detalle = `Cerró a las ${horaFin}`;
    } else {
      titular = `Arrancó hace ${enPalabras(faltan)}`;
      detalle = fin ? `Termina a las ${horaFin}` : `Empezó a las ${horaInicio}`;
    }
  }

  // Cada punto del cronograma se ubica en la línea de tiempo real de la noche.
  const puntos = programa
    .map((p) => ({ ...p, cuando: momento(fechaEvento, p.hora, (aMinutos(p.hora) ?? 0) < inicioMin) }))
    .filter((p): p is typeof p & { cuando: Date } => p.cuando !== null)
    .sort((a, b) => a.cuando.getTime() - b.cuando.getTime());

  const yaPasaron = puntos.filter((p) => p.cuando.getTime() <= ahora.getTime());
  const enCurso = yaPasaron[yaPasaron.length - 1];
  const siguiente = puntos.find((p) => p.cuando.getTime() > ahora.getTime());

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 p-6 shadow-2xl">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-300">
        <Clock className="h-4 w-4" /> Ahora
      </p>
      <p className="mt-2 text-4xl font-black leading-tight md:text-5xl">{titular}</p>
      <p className="mt-1 text-sm font-semibold text-slate-300">{detalle}</p>

      {(enCurso || siguiente) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {enCurso && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">En este momento</p>
              <p className="mt-1 text-lg font-black">{enCurso.titulo}</p>
              <p className="text-sm font-semibold text-slate-300">Desde las {enCurso.hora}</p>
            </div>
          )}
          {siguiente && (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Lo que sigue</p>
              <p className="mt-1 text-lg font-black">{siguiente.titulo}</p>
              <p className="text-sm font-semibold text-slate-300">
                A las {siguiente.hora} · en {enPalabras(siguiente.cuando.getTime() - ahora.getTime())}
              </p>
            </div>
          )}
        </div>
      )}

      {puntos.length === 0 && (
        <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-400">
          Esta fiesta no tiene cronograma cargado, así que no puedo avisarte qué toca ahora.
        </p>
      )}
    </div>
  );
}
