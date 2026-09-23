/**
 * MATAFUEGO — Votos, controles de la noche y Video de Vida (orden 81, 23 de septiembre de 2026).
 *
 * 1. Un invitado identificado votaba las veces que quisiera: su enlace no se miraba.
 *    Tambien se podia votar en una votacion ya cerrada.
 * 2. Abrir/cerrar votaciones, borrar contenido, marcar canciones y destacar mensajes
 *    pedian solo "tener sesion": un operador de otra fiesta podia manejar esta.
 * 3. Los ajustes del Video de Vida se podian reescribir sin cuenta.
 * 4. La pantalla publica recibia la lista de quienes votaron.
 *
 * Se probo rompiendolo: sin la comprobacion de "ya votaste" se cae la primera; con
 * `requireAppSession` en lugar del permiso por fiesta, la del operador ajeno.
 */
process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

const fiestas: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => (fiestas[id] ? copia(fiestas[id]) : null)),
  saveFiesta: jest.fn(async (f: any) => { fiestas[f.id] = copia(f); return { success: true }; }),
}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/crm/public-lead-persistence', () => ({ upsertPublicCommercialLead: jest.fn() }));
jest.mock('@/app/actions/public-guest-portal', () => ({ getPublicGuestPortalData: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockRejectedValue(new Error('Sesion no autorizada.')),
  hasAppSession: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async (fiestaId: string) => {
    if (fiestaId !== 'fiesta-propia') throw new Error('Este evento no está asignado a tu usuario.');
    return fiestas[fiestaId];
  }),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: jest.fn(async (id: string) => (fiestas[id] ? copia(fiestas[id]) : null)),
}));

import {
  votarEnVivo,
  toggleVotacionActiva,
  deleteContenidoEnVivo,
  getEventoEnVivoData,
} from '@/app/actions/evento-en-vivo';
import { updateVideoVidaSettings } from '@/app/actions/fiesta/video-vida.actions';

function armarFiesta(id: string) {
  fiestas[id] = {
    id,
    invitados: [{ id: 'inv-1', nombre: 'Ana', guestAccessToken: 'token-ana' }],
    eventoEnVivo: {
      fotos: [], solicitudesCanciones: [], mensajes: [],
      votaciones: [
        { id: 'v-abierta', pregunta: '¿Tema?', activa: true, timestamp: 'x', opciones: [{ id: 'a', texto: 'A', votos: 0 }] },
        { id: 'v-cerrada', pregunta: '¿Otro?', activa: false, timestamp: 'x', opciones: [{ id: 'a', texto: 'A', votos: 0 }] },
      ],
    },
    videoVida: { photoCount: 10 },
  };
}

const votos = (fiestaId: string, votacionId: string) =>
  fiestas[fiestaId].eventoEnVivo.votaciones.find((v: any) => v.id === votacionId).opciones[0].votos;

describe('La noche no se maneja de costado', () => {
  beforeEach(() => {
    for (const k of Object.keys(fiestas)) delete fiestas[k];
    armarFiesta('fiesta-propia');
    armarFiesta('fiesta-ajena');
  });

  it('un invitado identificado vota una sola vez', async () => {
    const primero = await votarEnVivo('fiesta-propia', 'v-abierta', 'a', 'inv-1', 'token-ana');
    const segundo = await votarEnVivo('fiesta-propia', 'v-abierta', 'a', 'inv-1', 'token-ana');
    expect(primero.success).toBe(true);
    expect(segundo.success).toBe(false);
    expect(votos('fiesta-propia', 'v-abierta')).toBe(1);
  });

  it('con un enlace que no es el suyo no vota', async () => {
    const r = await votarEnVivo('fiesta-propia', 'v-abierta', 'a', 'inv-1', 'token-falso');
    expect(r.success).toBe(false);
    expect(votos('fiesta-propia', 'v-abierta')).toBe(0);
  });

  it('en una votacion cerrada no se vota', async () => {
    const r = await votarEnVivo('fiesta-propia', 'v-cerrada', 'a');
    expect(r.success).toBe(false);
    expect(votos('fiesta-propia', 'v-cerrada')).toBe(0);
  });

  it('la pantalla publica no recibe quien voto', async () => {
    await votarEnVivo('fiesta-propia', 'v-abierta', 'a', 'inv-1', 'token-ana');
    const publico = await getEventoEnVivoData('fiesta-propia');
    expect(JSON.stringify(publico)).not.toContain('inv-1');
    expect(publico.votaciones[0].opciones[0].votos).toBe(1);
  });

  it('un operador de otra fiesta no cierra votaciones ni borra contenido', async () => {
    const cerrar = await toggleVotacionActiva('fiesta-ajena', 'v-abierta');
    const borrar = await deleteContenidoEnVivo('fiesta-ajena', 'votacion', 'v-abierta');
    expect(cerrar.success).toBe(false);
    expect(borrar.success).toBe(false);
    expect(fiestas['fiesta-ajena'].eventoEnVivo.votaciones).toHaveLength(2);
    expect(fiestas['fiesta-ajena'].eventoEnVivo.votaciones[0].activa).toBe(true);
  });

  it('el operador de la fiesta si la maneja', async () => {
    const cerrar = await toggleVotacionActiva('fiesta-propia', 'v-abierta');
    expect(cerrar.success).toBe(true);
    expect(fiestas['fiesta-propia'].eventoEnVivo.votaciones[0].activa).toBe(false);
  });

  it('sin cuenta no se cambian los ajustes del Video de Vida', async () => {
    const r = await updateVideoVidaSettings('fiesta-propia', { photoCount: 1 } as any);
    expect(r.success).toBe(false);
    expect(fiestas['fiesta-propia'].videoVida.photoCount).toBe(10);
  });
});
