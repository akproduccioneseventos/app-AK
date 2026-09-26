/**
 * MATAFUEGO — El secretario hace tres cosas más (orden 74 bloque 5, orden 88 bloque 2).
 *
 * Con la IA simulada que devuelve cada acción, se llama de verdad a:
 *  - updateTareas (marcando la tarea hecha y preservando todas las demás)
 *  - addInvitado (con los datos dados)
 *  - createIncidente (con los datos y gravedad mapeada a prioridad)
 *
 * Se probó rompiéndolo a propósito: si complete_task filtra la lista o pisa tareas,
 * la prueba se pone en rojo.
 */

import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';
import { runMultiAgent } from '@/ai/flows/multiagent-flow';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateTareas } from '@/app/actions/fiesta/tareas.actions';
import { addInvitado } from '@/app/actions/fiesta/invitados.actions';
import { createIncidente } from '@/app/actions/incidents';

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { id: 'usr_test', role: 'admin' } }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'usr_test', role: 'admin' } }),
}));

jest.mock('@/ai/flows/multiagent-flow', () => ({
  runMultiAgent: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/tareas.actions', () => ({
  updateTareas: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/fiesta/invitados.actions', () => ({
  addInvitado: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/incidents', () => ({
  createIncidente: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/multiagent/chat-store', () => ({
  appendMultiAgentChatTurn: jest.fn().mockResolvedValue({ id: 'sess_1' }),
  listMultiAgentChatSessions: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn().mockResolvedValue(undefined),
  listAgentMemoryProfiles: jest.fn().mockResolvedValue([]),
}));

describe('El secretario hace tres cosas más', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('complete_task marca la tarea como hecha y NO borra las otras tareas de la lista', async () => {
    const tareasIniciales = [
      { id: 't1', texto: 'Instalar luces LED', completada: false },
      { id: 't2', texto: 'Armar catering', completada: false },
      { id: 't3', texto: 'Probar sonido', completada: true },
    ];

    (getFiestaById as jest.Mock).mockResolvedValueOnce({
      id: 'fiesta_123',
      tareas: [...tareasIniciales],
    });

    (runMultiAgent as jest.Mock).mockResolvedValueOnce({
      success: true,
      response: 'Entendido, marco las luces.',
      agentType: 'fiesta',
      agentName: 'Operativo',
      action: {
        type: 'complete_task',
        data: {
          fiestaId: 'fiesta_123',
          texto: 'luces',
        },
      },
    });

    const res = await sendPersistentMultiAgentMessage({
      message: 'Ya instalamos las luces',
      fiestaId: 'fiesta_123',
      agentType: 'fiesta',
    });

    expect(res.success).toBe(true);
    expect(updateTareas).toHaveBeenCalledTimes(1);

    const [fiestaIdLlamado, tareasActualizadas] = (updateTareas as jest.Mock).mock.calls[0];
    expect(fiestaIdLlamado).toBe('fiesta_123');

    // Comprobar que no se borraron las otras tareas
    expect(tareasActualizadas).toHaveLength(3);
    expect(tareasActualizadas.find((t: any) => t.id === 't1')?.completada).toBe(true);
    expect(tareasActualizadas.find((t: any) => t.id === 't2')?.completada).toBe(false);
    expect(tareasActualizadas.find((t: any) => t.id === 't3')?.completada).toBe(true);
  });

  it('complete_task sin decir cuál tarea no marca ninguna (no adivina la primera)', async () => {
    (getFiestaById as jest.Mock).mockResolvedValueOnce({
      id: 'fiesta_123',
      tareas: [{ id: 't1', texto: 'Instalar luces LED', completada: false }],
    });
    (runMultiAgent as jest.Mock).mockResolvedValueOnce({
      success: true,
      response: 'Listo.',
      agentType: 'fiesta',
      agentName: 'Operativo',
      action: { type: 'complete_task', data: { fiestaId: 'fiesta_123' } },
    });
    const res = await sendPersistentMultiAgentMessage({ message: 'Ya está', fiestaId: 'fiesta_123', agentType: 'fiesta' });
    expect(updateTareas).not.toHaveBeenCalled();
    expect(res.response).toMatch(/No encontré la tarea/);
  });

  it('add_guest llama a addInvitado con los datos del invitado', async () => {
    (runMultiAgent as jest.Mock).mockResolvedValueOnce({
      success: true,
      response: 'Anoto a Martín.',
      agentType: 'fiesta',
      agentName: 'Operativo',
      action: {
        type: 'add_guest',
        data: {
          fiestaId: 'fiesta_123',
          nombre: 'Martín Pérez',
          tipo: 'Adulto',
          menu: 'Celiaco',
        },
      },
    });

    const res = await sendPersistentMultiAgentMessage({
      message: 'Anotá a Martín Pérez de invitado',
      fiestaId: 'fiesta_123',
      agentType: 'fiesta',
    });

    expect(res.success).toBe(true);
    expect(addInvitado).toHaveBeenCalledTimes(1);
    expect(addInvitado).toHaveBeenCalledWith(
      'fiesta_123',
      expect.objectContaining({
        nombre: 'Martín Pérez',
        categoria: 'Adulto',
        dietaryRestriction: 'Celiaco',
      })
    );
  });

  it('create_incident llama a createIncidente con los datos y prioridad correcta', async () => {
    (runMultiAgent as jest.Mock).mockResolvedValueOnce({
      success: true,
      response: 'Registro el corte de luz.',
      agentType: 'fiesta',
      agentName: 'Operativo',
      action: {
        type: 'create_incident',
        data: {
          fiestaId: 'fiesta_123',
          titulo: 'Corte de luz',
          descripcion: 'Falla en el generador',
          gravedad: 'alta',
        },
      },
    });

    const res = await sendPersistentMultiAgentMessage({
      message: 'Hubo un corte de luz',
      fiestaId: 'fiesta_123',
      agentType: 'fiesta',
    });

    expect(res.success).toBe(true);
    expect(createIncidente).toHaveBeenCalledTimes(1);
    expect(createIncidente).toHaveBeenCalledWith(
      expect.objectContaining({
        fiestaId: 'fiesta_123',
        titulo: 'Corte de luz',
        descripcion: 'Falla en el generador',
        prioridad: 'Alta',
      })
    );
  });
});
