/**
 * Adenda del ensayo del asistente (13/11/2026): con sesión de auditor, el Encargado General contestaba 500 en
 * las tres preguntas. La IA ya había respondido, pero anotar el gasto (`registrarConsumoIA`) tiraba el error del
 * candado de solo lectura y la ruta devolvía error. Lo accesorio no puede tumbar la respuesta principal.
 */
jest.mock('server-only', () => ({}));

const mockWriteData = jest.fn().mockResolvedValue(true);
const mockReadData = jest.fn().mockResolvedValue({
  meses: {},
  dias: {},
  fallos: {},
  topeMensualUYU: 1000,
  topeDiarioProfundo: 40,
});

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

let usuario: { userId?: string; email?: string; perfil?: string; role?: string } | null = {
  userId: 'auditor_123',
  email: 'auditor@externo.com',
  perfil: 'auditor',
  role: 'auditor',
};

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => (usuario ? { success: true, user: usuario } : { success: false }),
}));

import { registrarConsumoIA, reservarConsumoIA, anotarFalloIA } from '@/lib/ai/consumo-servidor';

describe('Orden 291 — Bloque 3: El auditor puede probar la IA sin guardar nada', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    mockWriteData.mockClear();
    mockReadData.mockClear();
    usuario = {
      userId: 'auditor_123',
      email: 'auditor@externo.com',
      perfil: 'auditor',
      role: 'auditor',
    };
  });

  it('con sesión de auditor, registrarConsumoIA no escribe y no tira error', async () => {
    await expect(registrarConsumoIA('copiloto-presupuesto')).resolves.not.toThrow();
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('con sesión de auditor, reservarConsumoIA devuelve una reserva y no escribe', async () => {
    const reserva = await reservarConsumoIA('copiloto-presupuesto');
    expect(reserva).not.toBeNull();
    expect(typeof reserva?.liberar).toBe('function');
    expect(mockWriteData).not.toHaveBeenCalled();

    // Liberar tampoco escribe ni tira error
    await expect(reserva?.liberar()).resolves.not.toThrow();
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('con sesión de auditor, anotarFalloIA no escribe en la base', async () => {
    await expect(anotarFalloIA('simulador-copilot', 'Fallo de prueba')).resolves.not.toThrow();
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('con sesión del equipo sí se anota el gasto', async () => {
    usuario = { userId: 'admin_1', email: 'admin@ak.uy', perfil: 'admin', role: 'admin' };
    await registrarConsumoIA('multiagente');
    expect(mockWriteData).toHaveBeenCalledTimes(1);
  });
});
