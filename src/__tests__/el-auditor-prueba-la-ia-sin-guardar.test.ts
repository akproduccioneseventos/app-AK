const mockWriteData = jest.fn().mockResolvedValue(true);
const mockReadData = jest.fn().mockResolvedValue({ meses: {}, dias: {}, fallos: {}, topeMensualUYU: 1000, topeDiarioProfundo: 40 });

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: {
      userId: 'auditor_123',
      email: 'auditor@externo.com',
      perfil: 'auditor',
      role: 'auditor',
    },
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

import { registrarConsumoIA, reservarConsumoIA, anotarFalloIA } from '@/lib/ai/consumo-servidor';

describe('Orden 291 — Bloque 3: El auditor puede probar la IA sin guardar nada', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    mockWriteData.mockClear();
    mockReadData.mockClear();
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
});
