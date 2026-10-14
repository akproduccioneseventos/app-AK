import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { DEFAULT_PHOTO_MISSIONS, type PhotoMission } from '@/lib/games/game-engine';

/** Segundos que tiene el invitado para contestar desde que el operador lanza la pregunta. */
export const SEGUNDOS_PARA_RESPONDER = 20;
/** Puntos por acertar, más hasta `BONUS_MAXIMO` por rapidez (lineal sobre `SEGUNDOS_DEL_BONUS`). */
export const PUNTOS_POR_ACERTAR = 100;
export const BONUS_MAXIMO = 50;
export const SEGUNDOS_DEL_BONUS = 15;

const ID_DISPOSITIVO = /^[a-zA-Z0-9-]{8,64}$/;
const MOMENT_TAG_MISION = /^mision:([a-zA-Z0-9_-]{1,40})$/;

/** Puntos de una respuesta: el SERVIDOR los calcula; el celular nunca manda puntos. */
export function puntosDeTrivia(acerto: boolean, milisegundos: number): number {
  if (!acerto) return 0;
  const segundos = Math.max(0, milisegundos) / 1000;
  const bonus = Math.round(BONUS_MAXIMO * Math.max(0, 1 - segundos / SEGUNDOS_DEL_BONUS));
  return PUNTOS_POR_ACERTAR + bonus;
}

export function dispositivoValido(dispositivoId?: string): string | null {
  return typeof dispositivoId === 'string' && ID_DISPOSITIVO.test(dispositivoId) ? dispositivoId : null;
}

/** `mision:<id>` -> `<id>`; cualquier otra cosa -> null. */
export function idDeMisionDelTag(momentTag?: string | null): string | null {
  const m = typeof momentTag === 'string' ? MOMENT_TAG_MISION.exec(momentTag) : null;
  return m ? m[1] : null;
}

export function misionesDeLaFiesta(fiesta: Pick<FiestaEnPlanificacion, 'photoMissions'>): PhotoMission[] {
  return fiesta.photoMissions && fiesta.photoMissions.length > 0 ? fiesta.photoMissions : DEFAULT_PHOTO_MISSIONS;
}

/** "Sofía Pérez Gómez" -> "Sofía P."; así el podio no muestra el nombre completo de nadie. */
export function nombreCorto(nombre?: string): string {
  const partes = (nombre || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (partes.length === 0) return 'Invitado';
  const primero = partes[0].slice(0, 20);
  return partes.length > 1 ? `${primero} ${partes[partes.length - 1][0].toUpperCase()}.` : primero;
}

export function topCinco(items: { nombre: string; puntos: number }[]): { nombre: string; puntos: number }[] {
  return items
    .filter((i) => i.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 5)
    .map((i) => ({ nombre: nombreCorto(i.nombre), puntos: i.puntos }));
}

export function topTrivia(fiesta: Pick<FiestaEnPlanificacion, 'triviaGame'>) {
  return topCinco((fiesta.triviaGame?.participants || []).map((p) => ({ nombre: p.guestName, puntos: p.score })));
}

export function topCazadores(fiesta: Pick<FiestaEnPlanificacion, 'misionesFotos'>) {
  return topCinco(Object.values(fiesta.misionesFotos || {}).map((m) => ({ nombre: m.nombre, puntos: m.puntos })));
}

export interface QuienJuega {
  guestId?: string;
  guestAccessToken?: string;
  dispositivoId?: string;
  nombre?: string;
}

/**
 * Quién es el que juega, comprobado contra la fiesta: el invitado con su enlace personal vale por su
 * `guestId`; si no, el teléfono (id anónimo validado). Sin ninguno de los dos no hay jugador.
 */
export function resolverJugador(
  fiesta: Pick<FiestaEnPlanificacion, 'invitados'>,
  quien: QuienJuega,
): { clave: string; nombre: string; mesa?: string; esInvitado: boolean } | null {
  const guestId = typeof quien.guestId === 'string' ? quien.guestId : '';
  const token = typeof quien.guestAccessToken === 'string' ? quien.guestAccessToken : '';
  const invitado = guestId ? (fiesta.invitados || []).find((g) => g.id === guestId) : undefined;
  if (invitado && invitado.guestAccessToken && token && invitado.guestAccessToken === token) {
    return { clave: guestId, nombre: invitado.nombre || 'Invitado', mesa: invitado.tableNumber || undefined, esInvitado: true };
  }
  const dispositivo = dispositivoValido(quien.dispositivoId);
  if (dispositivo) {
    const nombre = (typeof quien.nombre === 'string' ? quien.nombre : '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
    return { clave: `d:${dispositivo}`, nombre: nombre || 'Invitado', esInvitado: false };
  }
  return null;
}
