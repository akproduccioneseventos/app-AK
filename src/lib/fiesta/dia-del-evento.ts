import { getUruguayParts, hoyEnUruguay } from '@/lib/utils';

/**
 * ¿La fiesta es hoy, ya pasó o falta? En Uruguay, no en la zona del navegador (Codex, auditoría
 * 69, PORTAL01). Antes `new Date('2026-10-05')` era la medianoche de Greenwich, que en Uruguay
 * es el 4 a las 21: el día de la fiesta, antes de empezar, el portal decía "Evento Concluido".
 *
 * La fiesta cruza la medianoche (21 a 5): hasta las 6 de la mañana del día siguiente sigue
 * siendo "hoy" y no se da por terminada.
 */
const HORA_EN_QUE_TERMINA_LA_NOCHE = 6;

export function diaDelEvento(fechaEvento: string | null | undefined, ahora: Date = new Date()): { esHoy: boolean; yaPaso: boolean } {
  const fecha = (fechaEvento || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { esHoy: false, yaPaso: false };
  const hoy = hoyEnUruguay(ahora);
  const { hour } = getUruguayParts(ahora);
  const ayer = hoyEnUruguay(new Date(ahora.getTime() - 24 * 60 * 60 * 1000));
  const esHoy = fecha === hoy || (fecha === ayer && hour < HORA_EN_QUE_TERMINA_LA_NOCHE);
  return { esHoy, yaPaso: !esHoy && fecha < hoy };
}
