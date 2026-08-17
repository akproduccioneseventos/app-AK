// Sin esto la prueba llama de verdad al contador de gasto de inteligencia
// artificial, que pega contra la base y tarda. Una prueba nunca puede gastar
// plata ni depender de la red: se corren decenas de veces por dia.
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

import {
  buildDailySnapshots,
  calculateCommercialAdsRoi,
} from '@/lib/presencia-digital/metricas-historicas';
import { buildDigitalPresenceDailyReview } from '@/lib/presencia-digital/revision-diaria';
import { COSTO_ESTIMADO_UYU } from '@/lib/ai/consumo';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { MetaAdsSummary } from '@/lib/marketing/meta-ads';

describe('Centro de Presencia Digital de AK Producciones', () => {
  const mockConnections: SocialConnection[] = [
    { platform: 'Instagram', isConnected: true, username: 'akproducciones' },
    { platform: 'Facebook', isConnected: true, username: 'AK Producciones Salto' },
    { platform: 'TikTok', isConnected: true, username: 'ak_eventos' },
    { platform: 'WhatsApp', isConnected: true, phoneNumber: '59899123456' },
  ];

  const mockPosts: SocialPost[] = [
    {
      id: 'post_1',
      platform: 'Instagram',
      isGeneralCampaign: true,
      publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      text: '¡Pista de baile activa en los XV de Sofía! 💫🎉',
      status: 'Publicado',
      performance: { likes: 350, interactions: 420 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_2',
      platform: 'Facebook',
      isGeneralCampaign: true,
      publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      text: 'Barra premium de tragos para bodas en Salto 🍹',
      status: 'Publicado',
      performance: { likes: 120, interactions: 180 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  describe('Bloque 2 — Guardar los números todos los días', () => {
    it('construye un snapshot por día y por plataforma', () => {
      const today = '2026-08-17';
      const snapshots = buildDailySnapshots({
        dateIso: today,
        connections: mockConnections,
        posts: mockPosts,
        leadsCountToday: 3,
        contractsCountToday: 1,
        revenueToday: 85000,
      });

      expect(snapshots.length).toBe(5); // Instagram, Facebook, TikTok, Google, YouTube
      const ig = snapshots.find((s) => s.platform === 'Instagram');
      expect(ig).toBeDefined();
      expect(ig?.date).toBe(today);
      expect(ig?.followers).toBeGreaterThan(0);
      expect(ig?.interactions).toBe(420);
    });
  });

  describe('Bloque 5 — Qué publicidad trae fiestas de verdad (ROI vs Señas)', () => {
    it('cruza el gasto de anuncios con fiestas firmadas y calcula el costo real por fiesta', () => {
      const mockAds: MetaAdsSummary = {
        connectionStatus: 'connected',
        adCurrency: 'UYU',
        revenueCurrency: 'UYU',
        currencyComparable: true,
        totalSpend: 10000,
        totalLeads: 15,
        totalConversions: 2,
        totalRevenue: 240000,
        averageCpl: 666,
        overallRoas: 24,
        reportedCampaignsCount: 2,
        campaigns: [
          {
            id: 'c1',
            name: 'Quinceañeras Salto 2026',
            spend: 6000,
            impressions: 8000,
            clicks: 250,
            ctrPct: 3.1,
            cpl: 600,
            leadsCount: 10,
            conversionsCount: 2,
            revenue: 200000,
            roasRatio: 33.3,
          },
          {
            id: 'c2',
            name: 'Bodas Primavera',
            spend: 4000,
            impressions: 4500,
            clicks: 120,
            ctrPct: 2.6,
            cpl: 800,
            leadsCount: 5,
            conversionsCount: 0,
            revenue: 0,
            roasRatio: 0,
          },
        ],
      };

      const mockLeads: CrmLead[] = [
        { id: 'lead_1', nombre: 'Carla', estado: 'Cita Agendada', acquisition: { source: 'facebook', campaign: 'Quinceañeras Salto 2026' }, createdAt: new Date().toISOString() },
        { id: 'lead_2', nombre: 'Martina', estado: 'Presupuesto Enviado', acquisition: { source: 'instagram', campaign: 'Quinceañeras Salto 2026' }, createdAt: new Date().toISOString() },
        { id: 'lead_3', nombre: 'Lucía', estado: 'Ganado', acquisition: { source: 'facebook', campaign: 'Bodas Primavera' }, createdAt: new Date().toISOString() },
      ];

      const mockBudgets: Presupuesto[] = [
        {
          id: 'pres_1',
          clienteNombre: 'Carla',
          leadId: 'lead_1',
          estado: 'Aceptado',
          totalFinal: 120000,
          acquisition: { source: 'facebook', campaign: 'Quinceañeras Salto 2026' },
          timestamp: new Date().toISOString(),
        } as Presupuesto,
        {
          id: 'pres_2',
          clienteNombre: 'Martina',
          leadId: 'lead_2',
          estado: 'Facturado',
          totalFinal: 95000,
          acquisition: { source: 'instagram', campaign: 'Quinceañeras Salto 2026' },
          timestamp: new Date().toISOString(),
        } as Presupuesto,
      ];

      const roi = calculateCommercialAdsRoi({
        adsSummary: mockAds,
        leads: mockLeads,
        budgets: mockBudgets,
        fiestas: [] as FiestaEnPlanificacion[],
      });

      expect(roi.length).toBeGreaterThanOrEqual(2);
      const topCamp = roi[0];
      // La mejor campaña debe ser la que trajo fiestas cerradas
      expect(topCamp.campaignName).toBe('Quinceañeras Salto 2026');
      expect(topCamp.conversionsCount).toBe(2);
      expect(topCamp.costPerParty).toBe(3000); // 6000 spend / 2 conversiones
      expect(topCamp.recommendation).toContain('Excelente retorno real');

      const sinCierres = roi.find((c) => c.campaignName === 'Bodas Primavera');
      expect(sinCierres?.conversionsCount).toBe(0);
      expect(sinCierres?.costPerParty).toBeNull();
      expect(sinCierres?.recommendation).toContain('sin señas');
    });
  });

  describe('Bloque 4 — La revisión diaria', () => {
    it('detecta el post con más impacto y las plataformas sin publicar', async () => {
      const review = await buildDigitalPresenceDailyReview({
        posts: mockPosts,
        connections: mockConnections,
      });

      expect(review.topPost).toBeDefined();
      expect(review.topPost?.id).toBe('post_1');
      expect(review.topPost?.interactions).toBe(420);

      // Facebook lleva 5 días sin postear en mockPosts
      const fbInactive = review.inactivePlatforms.find((p) => p.platform === 'Facebook');
      expect(fbInactive).toBeDefined();
      expect(fbInactive?.daysWithoutPost).toBeGreaterThanOrEqual(5);

      // Sugerencia diaria presente
      expect(review.dailyPostSuggestion.text.length).toBeGreaterThan(20);
      expect(review.dailyPostSuggestion.hashtags.length).toBeGreaterThan(0);
    });

    it('tiene cargado el costo estimado de la revisión diaria en el contador de IA', () => {
      expect(COSTO_ESTIMADO_UYU['revision-diaria']).toBe(2);
    });
  });
});
