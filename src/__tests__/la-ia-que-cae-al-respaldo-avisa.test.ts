let mockConsumoStore: any = { meses: {}, dias: {}, fallos: {}, topeMensualUYU: 0, topeDiarioProfundo: 40 };

const mockAvisarAlDuenio = jest.fn().mockResolvedValue({ pushEnviado: true, whatsAppEnviado: false });

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: (...args: any[]) => mockAvisarAlDuenio(...args),
}));

jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn().mockResolvedValue(undefined),
  esSesionDeAuditor: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'ai-consumo.json') {
      return JSON.parse(JSON.stringify(mockConsumoStore));
    }
    return fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'ai-consumo.json') {
      mockConsumoStore = JSON.parse(JSON.stringify(data));
    }
    return true;
  }),
}));

import { anotarFalloIA, getFallosIAHoy } from '@/lib/ai/consumo-servidor';

describe('Orden 291 — Bloque 2: La IA que cae al respaldo avisa', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    mockConsumoStore = { meses: {}, dias: {}, fallos: {}, topeMensualUYU: 0, topeDiarioProfundo: 40 };
    mockAvisarAlDuenio.mockClear();
  });

  it('con el modelo simulado fallando, anotarFalloIA suma 1 y registra motivo', async () => {
    const ahora = '2026-11-13T12:00:00.000Z';
    await anotarFalloIA('simulador-copilot', 'Error 503 Service Unavailable', ahora);

    const fallos = await getFallosIAHoy(ahora);
    expect(fallos['simulador-copilot']).toBeDefined();
    expect(fallos['simulador-copilot'].cantidad).toBe(1);
    expect(fallos['simulador-copilot'].ultimoMotivo).toBe('Error 503 Service Unavailable');
    expect(mockAvisarAlDuenio).not.toHaveBeenCalled();
  });

  it('al sexto fallo del día de una misma función se llama avisarAlDuenio una vez', async () => {
    const ahora = '2026-11-13T15:00:00.000Z';

    // Primeros 5 fallos
    for (let i = 1; i <= 5; i++) {
      await anotarFalloIA('simulador-copilot', `Fallo número ${i}`, ahora);
    }

    const fallosTrasCinco = await getFallosIAHoy(ahora);
    expect(fallosTrasCinco['simulador-copilot'].cantidad).toBe(5);
    expect(mockAvisarAlDuenio).not.toHaveBeenCalled();

    // 6to fallo
    await anotarFalloIA('simulador-copilot', 'Fallo número 6', ahora);

    expect(mockAvisarAlDuenio).toHaveBeenCalledTimes(1);
    const llamada = mockAvisarAlDuenio.mock.calls[0][0];
    expect(llamada[0].titulo).toContain('simulador-copilot');
    expect(llamada[0].quePasa).toContain('6 veces');

    // 7mo fallo: no debe volver a disparar el aviso en el mismo día
    await anotarFalloIA('simulador-copilot', 'Fallo número 7', ahora);
    expect(mockAvisarAlDuenio).toHaveBeenCalledTimes(1);
  });
});
