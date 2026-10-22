/**
 * @jest-environment node
 */
/**
 * MATAFUEGO — Codex 249 (orden 217), R1, 22/10/2026: sin CRON_SECRET, cualquiera de afuera disparaba
 * el recordatorio a los invitados que no abrieron la invitación, y ese recordatorio MANDA (WhatsApp y
 * Gmail). La puerta lo dejaba pasar porque figuraba entre "las que no hacen daño".
 *
 * Ahora, sin clave configurada, la puerta lo frena con 503 y el motor no corre. Con la clave, corre.
 * La tarea sigue corriendo todos los días por dentro (al entrar el equipo a la app), sin esta puerta.
 *
 * R2, R3 y R4 (fecha reprogramada, envío fallido que consume el día y reserva fallida anotada como
 * corrida) son del motor y van a Gemini: cuando lleguen, sus casos se suman a este archivo.
 * Se probó rompiéndolo: volviendo a poner la tarea en la lista, el primer caso se pone en rojo.
 */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
const correr = jest.fn(async () => ({ corrio: true, enviados: 0, fallados: 0 }));
jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({ correrTareaRecordarInvitacionNoAbierta: correr }));
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: jest.fn(async () => undefined) }));

import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';

const pedido = (clave?: string) =>
  new Request('https://ak.test/api/cron/recordar-invitacion-no-abierta', clave ? { headers: { Authorization: `Bearer ${clave}` } } : {});

describe('R1: el recordatorio que manda no se dispara desde afuera sin clave', () => {
  const antes = process.env.CRON_SECRET;
  afterEach(() => {
    if (antes === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = antes;
    correr.mockClear();
  });

  it('sin clave configurada, la puerta lo frena (503)', async () => {
    delete process.env.CRON_SECRET;
    const r = await abrirPuertaDeLaTarea(pedido(), 'recordar-invitacion-no-abierta');
    expect(r.permitido).toBe(false);
    expect(r.estado).toBe(503);
  });

  it('las tareas que sólo preparan siguen corriendo sin clave', async () => {
    delete process.env.CRON_SECRET;
    expect((await abrirPuertaDeLaTarea(pedido(), 'recordatorio-a-los-invitados')).permitido).toBe(true);
    expect((await abrirPuertaDeLaTarea(pedido(), 'avisos-al-cliente')).permitido).toBe(true);
  });

  it('con clave configurada: sin ella 401, con ella pasa', async () => {
    process.env.CRON_SECRET = 'secreto';
    expect((await abrirPuertaDeLaTarea(pedido(), 'recordar-invitacion-no-abierta')).estado).toBe(401);
    expect((await abrirPuertaDeLaTarea(pedido('secreto'), 'recordar-invitacion-no-abierta')).permitido).toBe(true);
  });

  it('la ruta, sin clave configurada, no llega a correr el motor', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('@/app/api/cron/recordar-invitacion-no-abierta/route');
    const res = await GET(pedido() as any);
    expect(res.status).toBe(503);
    expect(correr).not.toHaveBeenCalled();
  });
});
