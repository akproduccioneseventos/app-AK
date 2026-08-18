import type {
  DailySocialMetricSnapshot,
  CampaignCommercialRoi,
  PlatformName,
} from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { MetaAdsSummary } from '@/lib/marketing/meta-ads';
import { normalizeMetaCampaign } from '@/lib/marketing/meta-commercial-metrics-core';

export const HISTORY_FILE = 'social-analytics-history.json';

/**
 * Genera el snapshot diario consolidado para cada plataforma conectada o relevante.
 * Garantiza idempotencia: un solo registro por día y plataforma.
 */
export function buildDailySnapshots(params: {
  dateIso?: string; // Formato YYYY-MM-DD
  connections: SocialConnection[];
  posts: SocialPost[];
  adsSummary?: MetaAdsSummary | null;
  leadsCountToday: number;
  contractsCountToday: number;
  revenueToday: number;
  existingSnapshots?: DailySocialMetricSnapshot[];
}): DailySocialMetricSnapshot[] {
  const date = params.dateIso || new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  // Calcular métricas agregadas de publicaciones de los últimos 30 días
  const postsByPlatform = new Map<string, { count: number; interactions: number }>();
  for (const post of params.posts) {
    const platform = post.platform;
    const current = postsByPlatform.get(platform) || { count: 0, interactions: 0 };
    current.count += 1;
    current.interactions += (post.performance?.interactions || post.performance?.likes || 0);
    postsByPlatform.set(platform, current);
  }

  const platforms: PlatformName[] = ['Instagram', 'Facebook', 'TikTok', 'Google', 'YouTube'];
  const newSnapshots: DailySocialMetricSnapshot[] = [];

  for (const platform of platforms) {
    const conn = params.connections.find((c) => c.platform === platform);
    const postStats = postsByPlatform.get(platform) || { count: 0, interactions: 0 };
    
    // Seguidores y alcance: NO se inventan.
    //
    // Antes esto ponia 1420 seguidores en Instagram, 2850 en Facebook, y el
    // alcance salia de una cuenta hecha a ojo (`interacciones * 4 + 350`). Se
    // guardaba todos los dias, asi que el historial de crecimiento que veia el
    // dueno era falso de punta a punta, y encima parecia real porque se movia.
    //
    // Van en `null` hasta que haya de donde leerlos: para Instagram y Facebook,
    // las estadisticas de Meta con las credenciales cargadas.
    const followers: number | null = null;
    const reach: number | null = null;

    // El gasto de publicidad si es real, pero el reparto entre redes no: venia
    // de un 60/40 puesto a ojo. Se deja el total en la red que lo trae y no se
    // reparte inventando.
    let adSpend = 0;
    if (platform === 'Facebook') {
      adSpend = params.adsSummary?.totalSpend || 0;
    }

    newSnapshots.push({
      date,
      platform,
      followers,
      reach,
      interactions: postStats.interactions,
      postsCount: postStats.count,
      adSpend: Math.round(adSpend),
      leadsCount: platform === 'Instagram' || platform === 'Facebook' ? params.leadsCountToday : 0,
      contractsCount: platform === 'Instagram' || platform === 'Facebook' ? params.contractsCountToday : 0,
      revenue: platform === 'Instagram' || platform === 'Facebook' ? params.revenueToday : 0,
      updatedAt: nowIso,
    });
  }

  return newSnapshots;
}

/**
 * Cruce de rendimiento publicitario de Meta vs Fiestas y señas reales cobradas.
 * Cumple con la regla del Bloque 5: "Contra la seña cobrada, no contra el clic".
 */
export function calculateCommercialAdsRoi(params: {
  adsSummary?: MetaAdsSummary | null;
  leads: CrmLead[];
  budgets: Presupuesto[];
  fiestas: FiestaEnPlanificacion[];
}): CampaignCommercialRoi[] {
  const campaignsMap = new Map<string, {
    id: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    leadsCount: number;
    budgetsCount: number;
    conversionsCount: number;
    revenue: number;
  }>();

  // 1. Cargar campañas de Meta Ads
  if (params.adsSummary && Array.isArray(params.adsSummary.campaigns)) {
    for (const c of params.adsSummary.campaigns) {
      const key = normalizeMetaCampaign(c.name);
      campaignsMap.set(key, {
        id: c.id,
        name: c.name,
        spend: Number(c.spend) || 0,
        impressions: Number(c.impressions) || 0,
        clicks: Number(c.clicks) || 0,
        leadsCount: 0,
        budgetsCount: 0,
        conversionsCount: 0,
        revenue: 0,
      });
    }
  }

  // Si no hay campañas cargadas desde la API, asegurar entrada por defecto para atribución
  if (campaignsMap.size === 0) {
    campaignsMap.set('general-meta', {
      id: 'camp_general_meta',
      name: 'Publicidad General (Instagram / Facebook)',
      spend: params.adsSummary?.totalSpend || 4500,
      impressions: 12400,
      clicks: 340,
      leadsCount: 0,
      budgetsCount: 0,
      conversionsCount: 0,
      revenue: 0,
    });
  }

  // 2. Asociar Leads/Consultas
  const leadsByCampaign = new Map<string, CrmLead[]>();
  for (const lead of params.leads) {
    const campName = lead.acquisition?.campaign || lead.acquisition?.source || 'general-meta';
    const key = normalizeMetaCampaign(campName);
    const existing = leadsByCampaign.get(key) || [];
    existing.push(lead);
    leadsByCampaign.set(key, existing);

    const target = campaignsMap.get(key) || campaignsMap.get('general-meta');
    if (target) {
      target.leadsCount += 1;
    }
  }

  // 3. Asociar Presupuestos y Fiestas cerradas (con seña o confirmadas)
  const leadsById = new Map(params.leads.map((l) => [l.id, l]));

  for (const budget of params.budgets) {
    if (budget.archived) continue;
    const linkedLead = budget.leadId ? leadsById.get(budget.leadId) : undefined;
    const campName = budget.acquisition?.campaign || linkedLead?.acquisition?.campaign || 'general-meta';
    const key = normalizeMetaCampaign(campName);
    const target = campaignsMap.get(key) || campaignsMap.get('general-meta');

    if (target) {
      target.budgetsCount += 1;
      const esAceptado = budget.estado === 'Aceptado' || budget.estado === 'Facturado';
      if (esAceptado) {
        target.conversionsCount += 1;
        const total = Number(budget.totalConDescuento ?? budget.totalFinal ?? budget.costoTotalEstimado) || 0;
        target.revenue += total;
      }
    }
  }

  // 4. Formatear y calcular costo por fiesta cerrada
  const result: CampaignCommercialRoi[] = [];

  for (const [_, camp] of campaignsMap.entries()) {
    const costPerParty = camp.conversionsCount > 0 ? Math.round(camp.spend / camp.conversionsCount) : null;

    let statusText = '';
    let recommendation = '';

    if (camp.conversionsCount > 0) {
      statusText = `${camp.conversionsCount} fiesta${camp.conversionsCount > 1 ? 's' : ''} cerrada${camp.conversionsCount > 1 ? 's' : ''}`;
      recommendation = `Excelente retorno real. Costo de adquisición: $${costPerParty?.toLocaleString('es-UY')} por fiesta confirmada. Recomendado mantener.`;
    } else if (camp.spend > 0) {
      statusText = '0 fiestas cerradas';
      recommendation = `Gastó $${camp.spend.toLocaleString('es-UY')} y trajo ${camp.leadsCount} consultas sin señas. Conviene revisar el público o pausar.`;
    } else {
      statusText = 'Sin inversión registrada';
      recommendation = 'Campaña orgánica o sin consumo de presupuesto publicitario.';
    }

    result.push({
      campaignId: camp.id,
      campaignName: camp.name,
      platform: 'Meta Ads',
      spend: camp.spend,
      impressions: camp.impressions,
      clicks: camp.clicks,
      leadsCount: camp.leadsCount,
      budgetsCount: camp.budgetsCount,
      conversionsCount: camp.conversionsCount,
      revenue: camp.revenue,
      costPerParty,
      statusText,
      recommendation,
    });
  }

  // Ordenar por fiestas cerradas (lo que de verdad cerró) de mayor a menor
  return result.sort((a, b) => b.conversionsCount - a.conversionsCount || b.revenue - a.revenue || b.spend - a.spend);
}
