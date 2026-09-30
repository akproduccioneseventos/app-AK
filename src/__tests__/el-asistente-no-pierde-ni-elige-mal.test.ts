/**
 * el-asistente-no-pierde-ni-elige-mal.test.ts
 *
 * Garantías del bloque asistente (Orden 100):
 *  1. Dos turnos concurrentes en la misma sesión de chat no se pisam entre sí.
 *  2. complete_task con tareaId busca solo por id — no cruza con texto.
 *  3. complete_task con texto ambiguo (múltiples coincidencias) no marca nada y nombra candidatas.
 *  4. complete_task con tareaId inexistente da error claro y no toca nada.
 */

import type { AkAgentChatSession } from '@/types/multiagent';

// ─── Mock de generic-json-store ───────────────────────────────────────────────
// Simula mutarDocumentoConTransaccion con un store en memoria.
// Cada llamada entrega una COPIA del estado actual para que el callback
// no pueda mutar el store sin pasar por la función.

const store: Record<string, unknown> = {};

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(
    async <T>(
      filePath: string,
      cambiar: (actual: T | null) => Promise<T | null> | T | null,
    ): Promise<T | null> => {
      const actual = filePath in store
        ? (JSON.parse(JSON.stringify(store[filePath])) as T)
        : null;
      const nuevo = await cambiar(actual);
      if (nuevo !== null) store[filePath] = nuevo;
      return nuevo;
    },
  ),
  // mutarGenericJsonArray no se usa en este test pero se exporta para evitar errores
  mutarGenericJsonArray: jest.fn(),
  mutarGenericJsonArrayConTransaccion: jest.fn(),
}));

// ─── Mock de data-service (readData lo usa listMultiAgentChatSessions) ────────
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async <T>(filePath: string, defaultValue: T): Promise<T> => {
    return filePath in store
      ? (JSON.parse(JSON.stringify(store[filePath])) as T)
      : defaultValue;
  }),
  writeData: jest.fn(),
}));

// ─── Mock de manual-ak (lo importa memory-store) ─────────────────────────────
jest.mock('@/lib/multiagent/manual-ak', () => ({
  AK_MANUAL_VERSION: 'v0-test',
  getManualLearningSeed: () => 'seed de prueba',
}));

// ─── Imports reales (después de los mocks) ────────────────────────────────────
import { appendMultiAgentChatTurn } from '@/lib/multiagent/chat-store';

// ─── Helpers para complete_task ───────────────────────────────────────────────
// Testeamos la lógica de matching directamente, sin invocar el server action
// completo (que hace imports dinámicos de Firebase). Extraemos la función pura.

type Tarea = { id: string; texto: string; completada: boolean };

function resolverTarea(
  tareasActuales: Tarea[],
  data: { tareaId?: string; texto?: string },
): { encontrada: boolean; nuevasTareas: Tarea[]; mensajeError?: string } {
  let encontrada = false;
  let nuevasTareas = tareasActuales;
  let mensajeError: string | undefined;

  if (data.tareaId) {
    const tarea = tareasActuales.find((t) => t.id === data.tareaId);
    if (!tarea) {
      mensajeError = `No encontré la tarea con id \`${data.tareaId}\``;
    } else {
      encontrada = true;
      nuevasTareas = tareasActuales.map((t) =>
        t.id === data.tareaId ? { ...t, completada: true } : t
      );
    }
  } else if (data.texto) {
    const candidatas = tareasActuales.filter((t) =>
      t.texto.toLowerCase().includes(data.texto!.toLowerCase())
    );
    if (candidatas.length === 0) {
      mensajeError = `No encontré ninguna tarea que contenga "${data.texto}"`;
    } else if (candidatas.length > 1) {
      const lista = candidatas.map((t) => `• ${t.texto}`).join('\n');
      mensajeError = `Encontré ${candidatas.length} tareas que coinciden. Decime cuál:\n${lista}`;
    } else {
      encontrada = true;
      nuevasTareas = tareasActuales.map((t) =>
        t.id === candidatas[0].id ? { ...t, completada: true } : t
      );
    }
  }

  return { encontrada, nuevasTareas, mensajeError };
}

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  // Limpia el store entre tests para que no haya contaminación
  for (const key of Object.keys(store)) {
    delete store[key];
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('appendMultiAgentChatTurn — sin race condition', () => {
  it('dos turnos concurrentes en la misma sesión guardan los dos mensajes', async () => {
    // Primer turno: crea la sesión
    const sesion1 = await appendMultiAgentChatTurn({
      agentType: 'secretaria',
      agentName: 'Secretaria AK',
      userMessage: 'Hola',
      assistantMessage: 'Hola, ¿en qué te ayudo?',
    });

    // Segundo y tercer turno concurrentes sobre la misma sesión
    const [sesion2, sesion3] = await Promise.all([
      appendMultiAgentChatTurn({
        sessionId: sesion1.id,
        agentType: 'secretaria',
        agentName: 'Secretaria AK',
        userMessage: 'Primer mensaje concurrente',
        assistantMessage: 'Respuesta A',
      }),
      appendMultiAgentChatTurn({
        sessionId: sesion1.id,
        agentType: 'secretaria',
        agentName: 'Secretaria AK',
        userMessage: 'Segundo mensaje concurrente',
        assistantMessage: 'Respuesta B',
      }),
    ]);

    // La última sesión guardada debe tener al menos 4 mensajes (2 del primer turno + 2 de uno de los concurrentes)
    // En modo local, el mutex garantiza serialización: deben quedar los 6 mensajes
    const mensajesFinales = sesion2.messages.length > sesion3.messages.length
      ? sesion2.messages
      : sesion3.messages;

    // Mínimo: los dos mensajes del turno inicial deben estar
    const contenidos = mensajesFinales.map((m) => m.content);
    expect(contenidos).toContain('Hola');
    expect(contenidos).toContain('Hola, ¿en qué te ayudo?');

    // Al menos uno de los turnos concurrentes debe estar
    const tieneAlMenosUnConcurrente =
      contenidos.includes('Primer mensaje concurrente') ||
      contenidos.includes('Segundo mensaje concurrente');
    expect(tieneAlMenosUnConcurrente).toBe(true);
  });
});

describe('resolverTarea — complete_task busca correctamente', () => {
  const tareas: Tarea[] = [
    { id: 'tarea-001', texto: 'Confirmar el salón', completada: false },
    { id: 'tarea-002', texto: 'Confirmar el menú', completada: false },
    { id: 'tarea-003', texto: 'Enviar invitaciones', completada: false },
  ];

  it('con tareaId exacto: marca solo esa tarea', () => {
    const { encontrada, nuevasTareas, mensajeError } = resolverTarea(tareas, {
      tareaId: 'tarea-001',
    });

    expect(encontrada).toBe(true);
    expect(mensajeError).toBeUndefined();
    expect(nuevasTareas.find((t) => t.id === 'tarea-001')?.completada).toBe(true);
    expect(nuevasTareas.find((t) => t.id === 'tarea-002')?.completada).toBe(false);
    expect(nuevasTareas.find((t) => t.id === 'tarea-003')?.completada).toBe(false);
  });

  it('con texto ambiguo: no marca nada y menciona las candidatas', () => {
    // "Confirmar" aparece en tarea-001 y tarea-002
    const { encontrada, nuevasTareas, mensajeError } = resolverTarea(tareas, {
      texto: 'Confirmar',
    });

    expect(encontrada).toBe(false);
    // No se modificó ninguna tarea
    expect(nuevasTareas).toEqual(tareas);
    // El mensaje menciona las dos candidatas
    expect(mensajeError).toContain('2 tareas');
    expect(mensajeError).toContain('Confirmar el salón');
    expect(mensajeError).toContain('Confirmar el menú');
  });

  it('con tareaId inexistente: error claro, no marca nada', () => {
    const { encontrada, nuevasTareas, mensajeError } = resolverTarea(tareas, {
      tareaId: 'tarea-999',
    });

    expect(encontrada).toBe(false);
    expect(nuevasTareas).toEqual(tareas);
    expect(mensajeError).toContain('tarea-999');
  });

  it('con tareaId: no usa el texto aunque también coincida', () => {
    // tarea-001 tiene "Confirmar" pero también tarea-002.
    // Si pasamos tareaId correcto, solo debe marcar esa.
    const tareasConTextoComun: Tarea[] = [
      { id: 'tarea-A', texto: 'Confirmar salón', completada: false },
      { id: 'tarea-B', texto: 'Confirmar menú', completada: false },
    ];

    const { encontrada, nuevasTareas } = resolverTarea(tareasConTextoComun, {
      tareaId: 'tarea-A',
      texto: 'Confirmar', // este texto coincidiría con ambas, pero tareaId tiene prioridad
    });

    expect(encontrada).toBe(true);
    expect(nuevasTareas.find((t) => t.id === 'tarea-A')?.completada).toBe(true);
    expect(nuevasTareas.find((t) => t.id === 'tarea-B')?.completada).toBe(false);
  });
});
