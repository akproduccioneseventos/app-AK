/**
 * Auditoría 86, IA: tareas del Multiagente y éxito falso.
 *
 * Qué se rompía:
 * - `crearTareaDesdeMultiagente` leía la fiesta entera y la guardaba entera: dos tareas pedidas a
 *   la vez decían "creada" las dos y sobrevivía una.
 * - `sendPersistentMultiAgentMessage` devolvía `action: create_task` aunque la tarea no se
 *   hubiera guardado, y el widget muestra "Tarea creada al toque" por el solo tipo de la acción.
 *
 * La base de mentira devuelve COPIAS en cada lectura y tarda (error 11): con la misma lista en
 * memoria las dos operaciones no se pisarían nunca y la prueba no probaría nada.
 *
 * Probado rompiéndolo: con la versión vieja (getFiestaById + saveFiesta) la primera prueba da
 * rojo (queda una tarea) y las de éxito falso dan rojo si se deja la acción en la respuesta.
 */
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { role: 'admin' } })) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: false, error: 'sin aviso' })),
}));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn(async () => undefined), listAgentMemoryProfiles: jest.fn(async () => []) }));
jest.mock('@/lib/multiagent/chat-store', () => ({
  appendMultiAgentChatTurn: jest.fn(async () => ({ id: 'chat-1' })),
  listMultiAgentChatSessions: jest.fn(async () => []),
}));
jest.mock('@/lib/multiagent/diagnostics', () => ({}));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f) }));

let fiesta: any;
const copia = <T,>(x: T): T => (x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)));
const esperar = () => new Promise((r) => setTimeout(r, 15));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => undefined),
  getFiestaById: jest.fn(async () => { await esperar(); return copia(fiesta); }),
  saveFiesta: jest.fn(async (f: any) => { await esperar(); fiesta = copia(f); return { success: true }; }),
}));
let turno: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn((_p: string, _v: any, cambiar: (a: any) => any) => {
    const r = turno.then(async () => {
      const nuevo = await cambiar(copia(fiesta));
      await esperar();
      if (nuevo !== null) fiesta = copia(nuevo);
      return nuevo;
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));

let respuestaIA: any;
jest.mock('@/ai/flows/multiagent-flow', () => ({ runMultiAgent: jest.fn(async () => copia(respuestaIA)) }));

import { crearTareaDesdeMultiagente, sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';

beforeEach(() => {
  fiesta = { id: 'f1', tareas: [], notas: 'base intacta' };
  respuestaIA = {
    success: true, agentType: 'fiesta', agentName: 'Agente', response: 'Listo.',
    action: { type: 'create_task', data: { texto: 'Llamar al DJ' } },
  };
});

describe('Tareas del Multiagente', () => {
  it('dos tareas pedidas a la vez quedan las dos, y el resto de la fiesta no se toca', async () => {
    const [a, b] = await Promise.all([
      crearTareaDesdeMultiagente({ fiestaId: 'f1', texto: 'Tarea A' }),
      crearTareaDesdeMultiagente({ fiestaId: 'f1', texto: 'Tarea B' }),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(fiesta.tareas.map((t: any) => t.texto).sort()).toEqual(['Tarea A', 'Tarea B']);
    expect(fiesta.notas).toBe('base intacta');
  });

  it('una fiesta que no existe devuelve error y no inventa una', async () => {
    fiesta = null;
    const r = await crearTareaDesdeMultiagente({ fiestaId: 'f1', texto: 'Tarea A' });
    expect(r.success).toBe(false);
    expect(fiesta).toBeNull();
  });
});

describe('El Multiagente no informa a la pantalla lo que no se guardó', () => {
  it('si la tarea se guardó, la acción create_task llega a la pantalla', async () => {
    const r = await sendPersistentMultiAgentMessage({ message: 'creá la tarea', fiestaId: 'f1', agentType: 'fiesta' });
    expect(fiesta.tareas.map((t: any) => t.texto)).toEqual(['Llamar al DJ']);
    expect(r.action?.type).toBe('create_task');
  });

  it('si la tarea NO se guardó, no hay acción create_task y el texto lo dice', async () => {
    fiesta = null;
    const r = await sendPersistentMultiAgentMessage({ message: 'creá la tarea', fiestaId: 'f1', agentType: 'fiesta' });
    expect(r.response).toContain('No pude guardar la tarea');
    expect(r.action?.type).not.toBe('create_task');
    expect(r.action).toBeUndefined();
  });

  it('crear tarea sin estar dentro de una fiesta tampoco avisa "creada"', async () => {
    const r = await sendPersistentMultiAgentMessage({ message: 'creá la tarea', agentType: 'fiesta' });
    expect(r.action).toBeUndefined();
  });

  it('un recordatorio que no se pudo crear no le llega a la pantalla como agendado', async () => {
    respuestaIA.action = { type: 'create_reminder', data: { mensaje: 'Llamar' } };
    const r = await sendPersistentMultiAgentMessage({ message: 'recordame', fiestaId: 'f1', agentType: 'fiesta' });
    expect(r.response).toContain('No pude agendar el recordatorio');
    expect(r.action).toBeUndefined();
  });
});
