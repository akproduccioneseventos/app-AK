/**
 * @jest-environment node
 */
import { chatWithVirtualAssistant } from '@/app/actions/asistente-virtual';

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/ai/cerebro', () => ({
  pedirTexto: jest.fn(async () => ({ ok: true, texto: '[GENERAR_PRESUPUESTO]' })),
}));

jest.mock('@/ai/genkit', () => ({
  getEffectiveGeminiModelForAgent: jest.fn(async () => 'gemini-model'),
  geminiProModel: 'gemini-pro',
}));

jest.mock('@/ai/modelos', () => ({
  MODELOS_GEMINI: { texto: ['model-1'] },
}));

jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn(async () => ({ paquetes: [], menus: [] })),
  captureSimulatorLeadProgress: jest.fn(async () => ({ success: false })),
}));

describe('El chat no dice anoté sin anotar', () => {
  it('no responde con "Anoté lo que me contaste" si falla el guardado del lead', async () => {
    const res = await chatWithVirtualAssistant([], 'sí, dale');
    expect(res.success).toBe(true);
    expect(res.text).not.toContain('Anoté lo que me contaste');
    expect(res.text).toContain('Para avanzar con tu presupuesto');
  });
});
