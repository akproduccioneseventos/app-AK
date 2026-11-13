/**
 * Adenda del ensayo del asistente (13/11/2026): con sesión de auditor, el Encargado General contestaba 500 en
 * las tres preguntas. La IA ya había respondido, pero anotar el gasto (`registrarConsumoIA`) tiraba el error del
 * candado de solo lectura y la ruta devolvía error. Lo accesorio no puede tumbar la respuesta principal.
 */
jest.mock('server-only', () => ({}));

const writeData = jest.fn(async () => undefined);
const readData = jest.fn(async (_archivo: string, vacio: unknown) => vacio);
jest.mock('@/lib/data-service', () => ({
  readData: (archivo: string, vacio: unknown) => readData(archivo, vacio),
  writeData: (...args: unknown[]) => writeData(...(args as [])),
}));

let usuario: { perfil?: string; role?: string } | null = { perfil: 'auditor', role: 'auditor' };
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => (usuario ? { success: true, user: usuario } : { success: false }),
}));

import { registrarConsumoIA, reservarConsumoIA } from '@/lib/ai/consumo-servidor';

describe('El auditor prueba la IA sin guardar nada', () => {
  beforeEach(() => {
    writeData.mockClear();
    usuario = { perfil: 'auditor', role: 'auditor' };
  });

  it('anotar el gasto con sesión de auditor no tira error ni escribe', async () => {
    await expect(registrarConsumoIA('multiagente')).resolves.toBeUndefined();
    expect(writeData).not.toHaveBeenCalled();
  });

  it('reservar con sesión de auditor devuelve una reserva y no escribe', async () => {
    const reserva = await reservarConsumoIA('multiagente');
    expect(reserva).not.toBeNull();
    await expect(reserva!.liberar()).resolves.toBeUndefined();
    expect(writeData).not.toHaveBeenCalled();
  });

  it('con sesión del equipo sí se anota el gasto', async () => {
    usuario = { perfil: 'admin', role: 'admin' };
    await registrarConsumoIA('multiagente');
    expect(writeData).toHaveBeenCalledTimes(1);
  });
});
