/** @jest-environment node */

/**
 * Orden 194 / Bloque 3: Auditoría 20-10 - No miente
 * - Sin token de Meta, pausar devuelve success: false.
 * - Sin campañas, no hay general-meta inventado.
 * - Sin llamada real a IA, no se registra consumo de IA.
 */

import { pausarCampana } from '@/lib/marketing/meta-ads-acciones';
import { calculateCommercialAdsRoi } from '@/lib/presencia-digital/metricas-historicas';
import { buildDigitalPresenceDailyReview } from '@/lib/presencia-digital/revision-diaria';
import * as consumoIaModule from '@/lib/ai/consumo-servidor';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
  createDataItem: jest.fn(async () => undefined),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => undefined),
}));

describe('Auditoría 20-10: No miente en publicidad, métricas e IA', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('1. Sin token de Meta, pausar campaña devuelve success: false y no simula éxito', async () => {
    delete process.env.META_ADS_ACCESS_TOKEN;
    const res = await pausarCampana('camp_test_999', 'Campaña 15s', 'Prueba de freno');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Meta Ads no está conectado');
  });

  it('2. Sin campañas reales en adsInsights, no se sintetiza ni inventa general-meta', () => {
    const roi = calculateCommercialAdsRoi({
      leads: [],
      budgets: [],
      adsInsights: [],
      adsSummary: undefined,
    });

    const tieneGeneralMeta = roi.some(
      (c) => c.campaignId === 'general-meta' || c.campaignId === 'camp_general_meta' || c.campaignName.includes('General')
    );
    expect(tieneGeneralMeta).toBe(false);
    expect(roi).toHaveLength(0);
  });

  it('3. La revisión diaria sin invocar modelo real de IA no registra consumo ficticio', async () => {
    const registrarSpy = jest.spyOn(consumoIaModule, 'registrarConsumoIA');

    const res = await buildDigitalPresenceDailyReview({
      posts: [],
      connections: [],
    });

    expect(res).toBeDefined();
    expect(registrarSpy).not.toHaveBeenCalled();
    expect(res.aiUsed).toBe(false);
  });
});
