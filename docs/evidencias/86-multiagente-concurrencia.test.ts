import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { borrarFiesta, guardarFiesta, leerFiesta } from '../../tests/e2e/helpers/fiesta-de-prueba';
jest.setTimeout(120000);

jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { role: 'admin' } })) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined), requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('next/headers', () => ({ headers: jest.fn(async () => new Headers()) }));
jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({ quienEsElEquipo: jest.fn(async () => () => true), usuarioDelEquipo: jest.fn(async () => ({ role: 'admin', perfil: 'administrador' })) }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn(async () => undefined), listAgentMemoryProfiles: jest.fn(async () => []) }));

describe('crearTareaDesdeMultiagente: persistencia concurrente real', () => {
  const temp = fs.realpathSync(os.tmpdir());
  const cwd = fs.realpathSync(process.cwd());

  beforeAll(() => {
    if (path.dirname(cwd) !== temp || !path.basename(cwd).startsWith('ak-entorno-aislado-') || process.env.AK_ENTORNO_AISLADO !== 'true') {
      throw new Error('Sonda permitida solo en ak-entorno-aislado-* dentro de TEMP con AK_ENTORNO_AISLADO=true');
    }
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
  });

  it('conserva las dos tareas y el contenido base de la Fiesta', async () => {
    const { crearTareaDesdeMultiagente } = await import('@/app/actions/multiagent');
    const id = `e2e_multiagent_race_${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const base = { id, tareas: [], cliente: { nombre: 'Fixture concurrencia' }, notas: 'base intacta' } as any;
    try {
      guardarFiesta(base);
      const resultados = await Promise.all([
        crearTareaDesdeMultiagente({ fiestaId: id, texto: 'sonda concurrente A' }),
        crearTareaDesdeMultiagente({ fiestaId: id, texto: 'sonda concurrente B' }),
      ]);
      expect(resultados.every((r) => r.success)).toBe(true);
      const guardada = leerFiesta(id);
      expect(guardada).toMatchObject({ id, cliente: base.cliente, notas: base.notas });
      expect(guardada.tareas.map((t: { texto: string }) => t.texto)).toEqual(expect.arrayContaining(['sonda concurrente A', 'sonda concurrente B']));
    } finally {
      borrarFiesta(id);
    }
  });
});
