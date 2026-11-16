/** @jest-environment node */

let mockConsumo: any = {
  meses: {},
  dias: {},
  topeMensualUYU: 0,
  topeDiarioProfundo: 40,
};

let simularErrorLectura = false;
let usuarioSesion: any = null;

const mockClone = (val: any) => (val === undefined ? undefined : JSON.parse(JSON.stringify(val)));

jest.mock('server-only', () => ({}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => {
    if (usuarioSesion) {
      return { success: true, user: usuarioSesion };
    }
    return { success: false };
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (simularErrorLectura) {
      throw new Error('Falla simulada de lectura en base de datos');
    }
    if (file === 'ai-consumo.json') {
      return mockClone(mockConsumo ?? fallback);
    }
    return mockClone(fallback);
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'ai-consumo.json') {
      mockConsumo = mockClone(data);
    }
    return true;
  }),
  createDataItem: jest.fn(async (_file: string, _col: string, _id: string, _item: any) => true),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaForPortalSession: jest.fn().mockResolvedValue({
    id: 'fiesta_test_289',
    configuracion: {
      nombreEvento: 'XV de Martina',
      tipoCelebracion: 'XV Años',
      fechaEvento: '2026-12-15',
      nombreLugar: 'Salón Principal',
      invitadosEstimados: 120,
    },
    tareas: [],
  }),
}));

const mockGenerate = jest.fn();
jest.mock('@/ai/genkit', () => {
  const actual = jest.requireActual('@/ai/genkit');
  return {
    ...actual,
    generateWithGeminiFallback: jest.fn(async (args: any) => {
      mockGenerate(args);
      return { text: '¡Hola! Todo perfecto para tu fiesta.' };
    }),
  };
});

import {
  geminiFastModel,
  geminiProModel,
  getGeminiModelForAgent,
  getEffectiveGeminiModelForAgent,
} from '@/ai/genkit';
import {
  reservarRespuestaProfunda,
  setTopeDiarioProfundo,
  getResumenDeGasto,
} from '@/lib/ai/consumo-servidor';
import { chatConAsistenteCliente } from '@/app/actions/asistente-virtual';

describe('Orden 289 — La IA usa el cerebro solo donde importa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    simularErrorLectura = false;
    usuarioSesion = null;
    mockConsumo = {
      meses: {},
      dias: {},
      topeMensualUYU: 0,
      topeDiarioProfundo: 40,
    };
  });

  it('getGeminiModelForAgent("comercial", { deep: true }) y el asistente usan el profundo', async () => {
    expect(getGeminiModelForAgent('comercial', { deep: true })).toBe(geminiProModel);
    expect(geminiProModel).toBe('googleai/gemini-pro-latest');

    // El asistente virtual para clientes usa el modelo profundo y devuelve nivel 'profundo'
    const res = await chatConAsistenteCliente('fiesta_test_289', [], '¿A qué hora empieza la fiesta?');
    expect(res.success).toBe(true);
    expect(res.nivel).toBe('profundo');
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: geminiProModel,
      }),
    );
  });

  it('fiestas_general sin deep usa el rápido', () => {
    expect(getGeminiModelForAgent('fiestas_general')).toBe(geminiFastModel);
    expect(getGeminiModelForAgent('fiestas_general', { deep: false })).toBe(geminiFastModel);
    // Con deep sí usa el profundo
    expect(getGeminiModelForAgent('fiestas_general', { deep: true })).toBe(geminiProModel);
  });

  it('con topeDiarioProfundo: 2, la tercera llamada del día a getEffectiveGeminiModelForAgent devuelve el rápido, y al día siguiente (hora de Uruguay, 00:30) vuelve el profundo', async () => {
    mockConsumo.topeDiarioProfundo = 2;

    const dia1 = '2026-11-13T15:00:00-03:00';
    // 1ra llamada del día -> profundo
    const modelo1 = await getEffectiveGeminiModelForAgent('comercial', { deep: true, ahora: dia1 });
    expect(modelo1).toBe(geminiProModel);

    // 2da llamada del día -> profundo (alcanzó el tope de 2)
    const modelo2 = await getEffectiveGeminiModelForAgent('comercial', { deep: true, ahora: dia1 });
    expect(modelo2).toBe(geminiProModel);

    // 3ra llamada del día -> rápido (agotó el tope diario)
    const modelo3 = await getEffectiveGeminiModelForAgent('comercial', { deep: true, ahora: dia1 });
    expect(modelo3).toBe(geminiFastModel);

    // Al día siguiente en hora de Uruguay (00:30 de la madrugada) vuelve el profundo
    const dia2 = '2026-11-14T00:30:00-03:00';
    const modelo4 = await getEffectiveGeminiModelForAgent('comercial', { deep: true, ahora: dia2 });
    expect(modelo4).toBe(geminiProModel);
  });

  it('si la reserva tira error, devuelve el rápido', async () => {
    simularErrorLectura = true;
    const modelo = await getEffectiveGeminiModelForAgent('comercial', { deep: true });
    expect(modelo).toBe(geminiFastModel);
  });

  it('dos reservas a la vez con tope 1 dejan pasar una sola (la base de mentira devuelve una copia en cada lectura)', async () => {
    mockConsumo.topeDiarioProfundo = 1;
    const ahora = '2026-11-13T12:00:00-03:00';

    const [res1, res2] = await Promise.all([
      reservarRespuestaProfunda(ahora),
      reservarRespuestaProfunda(ahora),
    ]);

    expect([res1, res2].filter(Boolean)).toHaveLength(1);
    expect([res1, res2]).toContain(true);
    expect([res1, res2]).toContain(false);
  });

  it('registra la función con costo "respuesta-profunda" al reservar', async () => {
    mockConsumo.topeDiarioProfundo = 10;
    const ahora = '2026-11-13T10:00:00-03:00';

    const exito = await reservarRespuestaProfunda(ahora);
    expect(exito).toBe(true);

    const resumen = await getResumenDeGasto(new Date(ahora));
    expect(resumen.porFuncion['respuesta-profunda']).toBe(1);
    expect(resumen.respuestasProfundasHoy).toBe(1);
    expect(resumen.topeDiarioProfundo).toBe(10);
  });

  it('el auditor no puede cambiar el tope diario del cerebro', async () => {
    usuarioSesion = { userId: 'auditor_1', role: 'auditor', perfil: 'auditor' };
    await expect(setTopeDiarioProfundo(50)).rejects.toThrow(/auditor/i);
  });
});
