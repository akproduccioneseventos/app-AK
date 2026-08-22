let mockPresupuesto = true;

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => mockPresupuesto),
}));

import {
  DEFAULT_GEMINI_LATEST_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PRO_MODEL,
  getGeminiModelForAgent,
  getEffectiveGeminiModelForAgent,
  geminiFastModel,
  geminiProModel,
} from '@/ai/genkit';

describe('Asistente AK — Selección de Modelos y Fallback de Presupuesto', () => {
  beforeEach(() => {
    mockPresupuesto = true;
  });

  it('usa googleai/gemini-flash-latest como modelo por defecto para auto-actualización', () => {
    expect(DEFAULT_GEMINI_LATEST_MODEL).toBe('googleai/gemini-flash-latest');
    expect(DEFAULT_GEMINI_MODEL).toBe('googleai/gemini-flash-latest');
  });

  it('tiene configurado el modelo Pro para razonamiento profundo', () => {
    expect(DEFAULT_GEMINI_PRO_MODEL).toBe('googleai/gemini-2.5-pro');
  });

  it('selecciona el modelo Pro cuando se pide deep o para agentes complejos', () => {
    const modelDeep = getGeminiModelForAgent('central', { deep: true });
    expect(modelDeep).toBe(geminiProModel);

    const modelContable = getGeminiModelForAgent('contable');
    expect(modelContable).toBe(geminiProModel);
  });

  it('cae al modelo rápido cuando se alcanza el tope de presupuesto mensual de IA', async () => {
    mockPresupuesto = false;

    const effectiveModel = await getEffectiveGeminiModelForAgent('contable');
    expect(effectiveModel).toBe(geminiFastModel);
  });

  it('mantiene el modelo Pro cuando sí hay presupuesto disponible', async () => {
    mockPresupuesto = true;

    const effectiveModel = await getEffectiveGeminiModelForAgent('contable');
    expect(effectiveModel).toBe(geminiProModel);
  });
});
