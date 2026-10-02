import { PREGUNTAS_FRECUENTES_DEL_CONTRATO } from '@/data/preguntas-frecuentes-contrato';
import { chatConAsistenteCliente, chatWithVirtualAssistant } from '@/app/actions/asistente-virtual';
import { getFiestaForPortalSession } from '@/app/actions/fiesta/portal.actions';
import { generateWithGeminiFallback } from '@/ai/genkit';
import fs from 'fs';
import path from 'path';

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

jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn().mockResolvedValue({
    paquetes: [],
    menus: [],
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(undefined),
  createDataItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('Orden 101 - Las preguntas frecuentes del contrato llegan a todos lados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('el portal del cliente contiene la sección de preguntas frecuentes del contrato incluyendo "¿Y si cancelo?"', () => {
    const portalPageCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/portal-cliente/[id]/page.tsx'),
      'utf8'
    );
    expect(portalPageCode).toContain('PREGUNTAS_FRECUENTES_DEL_CONTRATO');

    const cancelFaq = PREGUNTAS_FRECUENTES_DEL_CONTRATO.find(f => f.pregunta.includes('cancelo'));
    expect(cancelFaq).toBeDefined();
    expect(cancelFaq?.pregunta).toBe('¿Y si cancelo?');
    expect(cancelFaq?.respuesta).toContain('penalidad del 30% del presupuesto');
  });

  it('la instrucción del asistente del cliente incluye "¿Y si cancelo?"', async () => {
    (getFiestaForPortalSession as jest.Mock).mockResolvedValueOnce({
      id: 'f_test',
      configuracion: { nombreEvento: 'Fiesta Test' },
    });
    (generateWithGeminiFallback as jest.Mock).mockResolvedValueOnce({ text: 'Respuesta' });

    await chatConAsistenteCliente('f_test', [], 'Hola');
    const callArgs = (generateWithGeminiFallback as jest.Mock).mock.calls[0][0];
    expect(callArgs.system).toContain('¿Y si cancelo?');
    expect(callArgs.system).toContain('30%');
  });

  it('la instrucción del vendedor virtual de la web incluye "¿Y si cancelo?"', async () => {
    (generateWithGeminiFallback as jest.Mock).mockResolvedValueOnce({ text: 'Respuesta' });

    await chatWithVirtualAssistant([], 'Hola');
    const callArgs = (generateWithGeminiFallback as jest.Mock).mock.calls[0][0];
    expect(callArgs.system).toContain('¿Y si cancelo?');
    expect(callArgs.system).toContain('30%');
  });

  it('¿Qué pasa si me atraso con un pago? dice 15 días y ninguna respuesta dice 5 días', () => {
    const atrasoFaq = PREGUNTAS_FRECUENTES_DEL_CONTRATO.find(f => f.pregunta.includes('atraso'));
    expect(atrasoFaq).toBeDefined();
    expect(atrasoFaq?.respuesta).toContain('15 días corridos');

    for (const faq of PREGUNTAS_FRECUENTES_DEL_CONTRATO) {
      expect(faq.respuesta).not.toMatch(/\b5 días\b/);
      expect(faq.respuesta).not.toMatch(/\bcinco días\b/);
    }
  });
});
