/**
 * MATAFUEGO — Pedirle una tarea al asistente fuera de una fiesta ya no es un "no se puede".
 *
 * Antes contestaba "para crear una tarea primero tenés que estar dentro de una fiesta" y el
 * usuario tenía que repetir el pedido como recordatorio. Ahora, sin fiesta, queda como
 * recordatorio general (el mismo camino de `create_reminder`) y la respuesta lo dice con todas las
 * letras: no era una tarea de una fiesta. Si el recordatorio no se pudo guardar, NO se informa a la
 * pantalla ninguna acción (el widget muestra "creada" por el solo tipo de la acción).
 *
 * Probado rompiéndolo: volviendo a la rama vieja (sólo el cartel), la primera prueba da rojo
 * (no hay aviso creado); sacando `noSeGuardo = true` del fallo, la tercera da rojo.
 */
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { role: 'admin' } })) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
const crearAviso = jest.fn();
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: (...a: any[]) => crearAviso(...a) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn(async () => undefined), listAgentMemoryProfiles: jest.fn(async () => []) }));
jest.mock('@/lib/multiagent/chat-store', () => ({
  appendMultiAgentChatTurn: jest.fn(async () => ({ id: 'chat-1' })),
  listMultiAgentChatSessions: jest.fn(async () => []),
}));
jest.mock('@/lib/multiagent/diagnostics', () => ({}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(), saveFiesta: jest.fn() }));

let respuestaIA: any;
jest.mock('@/ai/flows/multiagent-flow', () => ({ runMultiAgent: jest.fn(async () => JSON.parse(JSON.stringify(respuestaIA))) }));

import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';

beforeEach(() => {
  crearAviso.mockReset();
  crearAviso.mockResolvedValue({ success: true, notification: { id: 'n1' } });
  respuestaIA = {
    success: true, agentType: 'secretaria', agentName: 'Secretaria', response: 'Dale, lo anoto.',
    action: { type: 'create_task', data: { texto: 'Llamar al proveedor de sillas', fechaLimite: '2026-10-20' } },
  };
});

describe('create_task sin fiesta', () => {
  it('queda como recordatorio general y la respuesta lo dice', async () => {
    const r = await sendPersistentMultiAgentMessage({ message: 'anotá llamar al proveedor de sillas', agentType: 'secretaria' });
    expect(crearAviso).toHaveBeenCalledTimes(1);
    const aviso = crearAviso.mock.calls[0][0];
    expect(aviso.mensaje).toContain('Llamar al proveedor de sillas');
    expect(aviso.mensaje).toContain('2026-10-20');
    expect(r.response).toMatch(/recordatorio general/);
    expect(r.response).toMatch(/no es una tarea de una fiesta/);
    expect(r.response).not.toMatch(/tenés que estar dentro de una fiesta/);
    // A la pantalla le llega lo que de verdad pasó: un recordatorio, no una tarea.
    expect(r.action?.type).toBe('create_reminder');
  });

  it('con una fiesta en pantalla NO crea un recordatorio: sigue siendo una tarea de la fiesta', async () => {
    const { getFiestaById } = jest.requireMock('@/app/actions/fiesta/fiesta.actions');
    getFiestaById.mockResolvedValue(null); // la fiesta "no existe": la tarea falla y se dice
    const r = await sendPersistentMultiAgentMessage({ message: 'anotá la tarea', agentType: 'fiesta', fiestaId: 'f1' });
    expect(crearAviso).not.toHaveBeenCalled();
    expect(r.response).toMatch(/No pude guardar la tarea/);
  });

  it('si el recordatorio no se pudo guardar, lo dice y no le informa ninguna acción a la pantalla', async () => {
    crearAviso.mockResolvedValue({ success: false, error: 'sin aviso' });
    const r = await sendPersistentMultiAgentMessage({ message: 'anotá llamar al proveedor', agentType: 'secretaria' });
    expect(r.response).toMatch(/No pude guardar el pendiente/);
    expect(r.response).not.toMatch(/Lo dejé como recordatorio/);
    expect(r.action).toBeUndefined();
  });
});
