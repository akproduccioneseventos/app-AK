import { chatConAsistenteCliente } from '@/app/actions/asistente-virtual';
import { getFiestaForPortalSession } from '@/app/actions/fiesta/portal.actions';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { PREGUNTAS_FRECUENTES_DEL_CONTRATO } from '@/data/preguntas-frecuentes-contrato';

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaForPortalSession: jest.fn(),
}));

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(),
  geminiCommercialModel: 'gemini-test-model',
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(undefined),
  createDataItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: jest.fn().mockResolvedValue({ pushEnviado: true, whatsAppEnviado: false }),
}));

describe('Orden 101 - El asistente del cliente pide su sesión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sin sesión o con sesión incorrecta no lee la fiesta ni llama a la IA', async () => {
    (getFiestaForPortalSession as jest.Mock).mockResolvedValueOnce(null);

    const res = await chatConAsistenteCliente('fiesta_999', [], 'Hola, ¿a qué hora es la fiesta?');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Tu sesión del portal venció. Volvé a entrar.');
    expect(generateWithGeminiFallback).not.toHaveBeenCalled();
  });

  it('con la sesión correcta contesta y la instrucción incluye preguntas frecuentes del contrato', async () => {
    (getFiestaForPortalSession as jest.Mock).mockResolvedValueOnce({
      id: 'fiesta_valida',
      configuracion: {
        nombreEvento: '15 de Valentina',
        tipoCelebracion: '15 años',
        fechaEvento: '2026-11-20',
        nombreLugar: 'Club Uruguay',
        invitadosEstimados: 120,
      },
      tareas: [{ id: 't1', texto: 'Elegir vals', completada: false }],
    });

    (generateWithGeminiFallback as jest.Mock).mockResolvedValueOnce({
      text: '¡Hola! La fiesta de Valentina está prevista para el 20 de noviembre en el Club Uruguay.',
    });

    const res = await chatConAsistenteCliente('fiesta_valida', [], '¿Qué pasa si cancelo?');

    expect(res.success).toBe(true);
    expect(res.text).toContain('Valentina');
    expect(generateWithGeminiFallback).toHaveBeenCalledTimes(1);

    const callArgs = (generateWithGeminiFallback as jest.Mock).mock.calls[0][0];
    expect(callArgs.system).toContain('¿Y si cancelo?');
    expect(callArgs.system).toContain('30% del presupuesto');
    expect(callArgs.system).toContain(PREGUNTAS_FRECUENTES_DEL_CONTRATO[0].pregunta);
  });
});
