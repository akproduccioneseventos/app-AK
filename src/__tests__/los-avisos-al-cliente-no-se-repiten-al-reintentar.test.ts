/**
 * Barrido de la pregunta 40 tras Codex, auditoría 81: la tarea de avisos al cliente guardaba el
 * mensaje en la bandeja ADENTRO de la transacción de la fiesta. Si la base repite la transacción,
 * el mismo aviso quedaba dos veces. Probado rompiéndolo: con el guardado adentro, da rojo.
 */
const guardados: any[] = [];
const guardar = jest.fn(async (m: any) => { guardados.push(m); return { success: true, message: { id: `m${guardados.length}`, ...m } }; });
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: (...a: any[]) => (guardar as any)(...a) }));
jest.mock('@/lib/automatizaciones-engine', () => ({
  evaluarReglasParaFiesta: (f: any) => [{ id: `musica_${f.id}`, tipo: 'recordatorio' }],
}));
let fiestaGuardada: any;
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async () => [{ id: 'f1' }]) }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  // La base repite la transacción: corre el cambio dos veces sobre copias frescas.
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => Promise<any>) => {
    await cambiar(JSON.parse(JSON.stringify(fiestaGuardada)));
    fiestaGuardada = await cambiar(JSON.parse(JSON.stringify(fiestaGuardada)));
    return { success: true };
  }),
}));
const marcar = jest.fn();
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: (...a: any[]) => marcar(...a) }));

import { correrTareaAvisosAlCliente } from '@/lib/whatsapp/avisos-al-cliente';

beforeEach(() => {
  guardados.length = 0;
  guardar.mockClear();
  marcar.mockClear();
  fiestaGuardada = { id: 'f1', configuracion: { telefonoAsistencia: '099123456', clienteNombre: 'Ana' } };
});

it('un reintento de la base no deja el aviso dos veces en la bandeja', async () => {
  const r = await correrTareaAvisosAlCliente();
  expect(guardados).toHaveLength(1);
  expect(r.mensajesGenerados).toBe(1);
  expect(fiestaGuardada.avisosPreparados?.musica).toBeTruthy();
});

it('si el aviso no se guarda, la regla queda libre y la tarea no dice que salió', async () => {
  guardar.mockImplementationOnce(async () => ({ success: false, error: 'base caída' }) as any);
  await expect(correrTareaAvisosAlCliente()).rejects.toThrow();
  expect(fiestaGuardada.avisosPreparados?.musica).toBeUndefined();
  expect(marcar).not.toHaveBeenCalled();
});
