'use server';

import { randomUUID } from 'crypto';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { normalizarCodigoFiesta } from '@/lib/fiesta/codigo-fiesta';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { hoyEnUruguay } from '@/lib/utils';

const MENSAJE_NO_ENCONTRADO =
  'No te encontramos. Probá con el código de la fiesta, que está en tu invitación.';

const ESTADOS_CERRADOS = new Set([
  'cerrada',
  'cerrado',
  'finalizada',
  'finalizado',
  'archivada',
  'archivado',
  'cancelada',
  'cancelado',
  'suspendida',
  'suspendido',
]);

export type InvitadoPublicoMinimo = Pick<
  Invitado,
  'id' | 'nombre' | 'rsvp' | 'tableNumber' | 'categoria'
>;

export interface OpcionFiestaInvitado {
  fiestaId: string;
  nombreEvento: string;
  fechaEvento: string;
}

export type EntrarComoInvitadoResult =
  | {
      status: 'ok';
      fiestaId: string;
      guestId: string;
      token: string;
      invitado: InvitadoPublicoMinimo;
    }
  | {
      status: 'multiple';
      opciones: OpcionFiestaInvitado[];
    }
  | {
      status: 'ir_a_invitacion';
      fiestaId: string;
      url: string;
    }
  | {
      status: 'no_encontrado';
      error: string;
    };

function soloLoDelInvitado(invitado: Invitado): InvitadoPublicoMinimo {
  return {
    id: invitado.id,
    nombre: invitado.nombre,
    rsvp: invitado.rsvp,
    tableNumber: invitado.tableNumber,
    categoria: invitado.categoria,
  };
}

function normalizeGuestName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
    .replace(/\s+/g, ' ');
}

function fechaHaceDosDias(): string {
  const hoy = hoyEnUruguay(new Date());
  const [y, m, d] = hoy.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 2, 12)).toISOString().slice(0, 10);
}

function esFiestaAbiertaParaInvitados(
  fiesta: FiestaEnPlanificacion | null | undefined,
  limiteFecha: string,
): fiesta is FiestaEnPlanificacion {
  if (!fiesta || !fiesta.id) return false;
  if ((fiesta as { archivada?: boolean }).archivada === true) return false;
  const estado = String(fiesta.estado || '').trim().toLowerCase();
  const status = String((fiesta as { status?: string }).status || '').trim().toLowerCase();
  if (ESTADOS_CERRADOS.has(estado) || ESTADOS_CERRADOS.has(status)) return false;

  const fecha = String(fiesta.configuracion?.fechaEvento || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha < limiteFecha) return false;
  return true;
}

async function emitirCredencialInvitado(
  fiesta: FiestaEnPlanificacion,
  invitado: Invitado,
): Promise<EntrarComoInvitadoResult> {
  if (invitado.guestAccessToken) {
    return {
      status: 'ok',
      fiestaId: fiesta.id,
      guestId: invitado.id,
      token: invitado.guestAccessToken,
      invitado: soloLoDelInvitado(invitado),
    };
  }

  const nuevoToken = randomUUID();
  let invitadoFinal: Invitado = { ...invitado, guestAccessToken: nuevoToken };

  const guardado = await actualizarFiesta(
    fiesta.id,
    (actual) => {
      const invitados = (actual.invitados || []).map((item) => {
        if (item.id !== invitado.id) return item;
        const tokenExistente = item.guestAccessToken || nuevoToken;
        invitadoFinal = { ...item, guestAccessToken: tokenExistente };
        return invitadoFinal;
      });
      return { ...actual, invitados };
    },
    { publicRsvp: true },
  );

  if (!guardado.success) {
    console.warn('[entrarComoInvitado] No se pudo guardar guestAccessToken:', guardado.error);
    return {
      status: 'no_encontrado',
      error: 'No pudimos preparar tu pase en este momento. Probá de nuevo en unos segundos.',
    };
  }

  return {
    status: 'ok',
    fiestaId: fiesta.id,
    guestId: invitadoFinal.id,
    token: invitadoFinal.guestAccessToken || nuevoToken,
    invitado: soloLoDelInvitado(invitadoFinal),
  };
}

export async function entrarComoInvitado(input: {
  telefono?: string;
  codigoFiesta?: string;
  nombre?: string;
  fiestaIdElegida?: string;
}): Promise<EntrarComoInvitadoResult> {
  const telefonoNormalizado = normalizeUruguayPhone(input?.telefono);
  const codigoNormalizado = normalizarCodigoFiesta(input?.codigoFiesta);
  const nombreNormalizado = normalizeGuestName(input?.nombre || '');
  const identidadRateLimit = telefonoNormalizado || codigoNormalizado || 'vacio';

  try {
    await enforcePublicRateLimit({
      scope: 'entrar-como-invitado',
      identity: identidadRateLimit,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    await enforcePublicRateLimit({
      scope: 'entrar-como-invitado-ip',
      identity: 'ip',
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
  } catch (err) {
    console.warn('[entrarComoInvitado] Rate limit alcanzado:', err);
    return {
      status: 'no_encontrado',
      error: 'Demasiados intentos. Esperá unos minutos y volvé a probar.',
    };
  }

  let fiestasCrudas: FiestaEnPlanificacion[] = [];
  try {
    fiestasCrudas = await leerFiestasCrudas(false);
  } catch (err) {
    console.warn('[entrarComoInvitado] Error leyendo fiestas:', err);
    return { status: 'no_encontrado', error: MENSAJE_NO_ENCONTRADO };
  }

  const limiteFecha = fechaHaceDosDias();
  const fiestasAbiertas = fiestasCrudas.filter((f) => esFiestaAbiertaParaInvitados(f, limiteFecha));

  if (telefonoNormalizado.length >= 6) {
    const coincidencias: Array<{ fiesta: FiestaEnPlanificacion; invitado: Invitado }> = [];
    for (const fiesta of fiestasAbiertas) {
      const invitado = (fiesta.invitados || []).find((inv) => {
        const telInv = normalizeUruguayPhone(inv.contacto);
        return telInv.length >= 6 && telInv === telefonoNormalizado;
      });
      if (invitado) {
        coincidencias.push({ fiesta, invitado });
      }
    }

    if (input?.fiestaIdElegida) {
      const elegida = coincidencias.find((c) => c.fiesta.id === input.fiestaIdElegida);
      if (!elegida) {
        return { status: 'no_encontrado', error: MENSAJE_NO_ENCONTRADO };
      }
      return await emitirCredencialInvitado(elegida.fiesta, elegida.invitado);
    }

    if (coincidencias.length === 1) {
      return await emitirCredencialInvitado(coincidencias[0].fiesta, coincidencias[0].invitado);
    }

    if (coincidencias.length > 1) {
      return {
        status: 'multiple',
        opciones: coincidencias.map(({ fiesta }) => ({
          fiestaId: fiesta.id,
          nombreEvento:
            fiesta.configuracion?.nombreEvento ||
            fiesta.configuracion?.nombreAgasajado ||
            'Fiesta',
          fechaEvento: fiesta.configuracion?.fechaEvento || '',
        })),
      };
    }

    return { status: 'no_encontrado', error: MENSAJE_NO_ENCONTRADO };
  }

  if (codigoNormalizado) {
    const fiesta = fiestasAbiertas.find(
      (f) => normalizarCodigoFiesta(f.codigoFiesta) === codigoNormalizado,
    );
    if (!fiesta) {
      return { status: 'no_encontrado', error: MENSAJE_NO_ENCONTRADO };
    }

    if (nombreNormalizado) {
      const invitado = (fiesta.invitados || []).find(
        (inv) => normalizeGuestName(inv.nombre || '') === nombreNormalizado,
      );
      if (invitado) {
        return await emitirCredencialInvitado(fiesta, invitado);
      }
    }

    return {
      status: 'ir_a_invitacion',
      fiestaId: fiesta.id,
      url: `/invitacion/${encodeURIComponent(fiesta.id)}`,
    };
  }

  return { status: 'no_encontrado', error: MENSAJE_NO_ENCONTRADO };
}
