/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => ({})),
  writeData: jest.fn(async () => undefined),
  mutateDataItem: jest.fn(async () => undefined),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

const mockGenerateWithGeminiFallback = jest.fn(async () => ({ text: 'Respuesta dummy' }));
jest.mock('@/ai/genkit', () => {
  const actual = jest.requireActual('@/ai/modelos');
  return {
    MODELOS_GEMINI: actual.MODELOS_GEMINI,
    geminiModel: 'googleai/gemini-2.5-flash',
    geminiCommercialModel: 'googleai/gemini-2.5-flash',
    geminiMarketingModel: 'googleai/gemini-2.5-flash',
    geminiProModel: 'googleai/gemini-2.5-pro',
    getGeminiModelForAgent: jest.fn(() => 'googleai/gemini-2.5-flash'),
    getEffectiveGeminiModelForAgent: jest.fn(async () => 'googleai/gemini-2.5-flash'),
    getGeminiGenerationConfigForAgent: jest.fn(() => ({ maxOutputTokens: 2048 })),
    generateWithGeminiFallback: (...args: any[]) => mockGenerateWithGeminiFallback(...args),
  };
});

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => false),
  reservarConsumoIA: jest.fn(async () => null),
  registrarConsumoIA: jest.fn(async () => undefined),
  anotarFalloIA: jest.fn(async () => undefined),
  reservarRespuestaProfunda: jest.fn(async () => false),
}));

import { generateAiCommercialFollowup } from '@/lib/commercial/commercial-followup';
import { generateAiPostEventMaterial } from '@/lib/post-event/post-event-core';
import { clasificarComentario } from '@/lib/social-media/clasificador-comentarios';
import { generarResumenCompetenciaIA } from '@/lib/presencia-digital/competencia';
import { generateTestimonialFlow } from '@/ai/flows/generate-testimonial-flow';
import { generateSocialPost } from '@/ai/flows/generate-social-post-flow';
import { suggestPalette } from '@/ai/flows/suggest-palette-flow';

describe('Orden 358 — La IA de cada módulo pasa por el tope mensual vía cerebro', () => {
  const prevApiKey = process.env.GOOGLE_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_API_KEY = 'fake-test-key';
  });

  afterAll(() => {
    process.env.GOOGLE_API_KEY = prevApiKey;
  });

  it('cuando el tope está agotado, ninguno de los módulos llama a generateWithGeminiFallback', async () => {
    const f1 = await generateAiCommercialFollowup({
      id: 'l1',
      name: 'Ana',
      source: 'crm',
      reason: 'Consultó ayer',
    });
    expect(f1.success).toBe(false);

    const f2 = await generateAiPostEventMaterial({
      fiestaId: 'f1',
      clientName: 'Ana',
      eventName: 'Cumple Ana',
      eventType: 'Cumpleaños',
    });
    expect(f2.success).toBe(false);

    const f3 = await clasificarComentario('Divino todo', 'Lucía');
    expect(f3.classified).toBe(false);

    const f4 = await generateTestimonialFlow({
      clientName: 'Ana',
      eventType: 'Boda',
      eventDate: '2026-10-10',
    });
    expect(f4.error).toBeTruthy();

    const f5 = await generateSocialPost({ eventName: 'Fiesta' });
    expect(f5.caption).toBeTruthy();

    const f6 = await suggestPalette({ eventType: 'Boda' });
    expect(f6.colors.length).toBeGreaterThan(0);

    const f7 = await generarResumenCompetenciaIA();
    expect(f7).toBeTruthy();

    expect(mockGenerateWithGeminiFallback).not.toHaveBeenCalled();
  });
});
