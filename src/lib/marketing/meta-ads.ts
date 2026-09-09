import crypto from 'crypto';
import type { MetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics-core';
import { normalizeMetaCampaign } from '@/lib/marketing/meta-commercial-metrics-core';

export interface MetaAdCampaign {
  id: string;
  name: string;
  /**
   * El presupuesto diario configurado en Meta, en la moneda de la cuenta.
   *
   * **No es lo mismo que el gasto.** Antes el panel del tope dividia el gasto de los
   * ultimos treinta dias y, si daba cero, inventaba $500. Eso es un numero inventado
   * decidiendo cuanta plata queda para publicidad. Ahora se pide el dato de verdad; si
   * Meta no lo devuelve, queda `undefined` y el panel avisa que no esta verificado en
   * vez de inventarlo.
   */
  dailyBudgetUYU?: number;
  /** Si la campana esta encendida en Meta ahora mismo. `undefined` = no se pudo saber. */
  activa?: boolean;
  spend: number;
  impressions: number;
  clicks: number;
  ctrPct: number;
  cpl: number;
  leadsCount: number;
  conversionsCount: number;
  revenue: number;
  roasRatio: number | null;
}

export interface MetaAdsSummary {
  connectionStatus: 'connected' | 'not_configured' | 'error';
  connectionMessage?: string;
  adCurrency: string;
  revenueCurrency: string;
  currencyComparable: boolean;
  totalSpend: number;
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  averageCpl: number;
  overallRoas: number | null;
  reportedCampaignsCount: number;
  topEventType?: string;
  campaigns: MetaAdCampaign[];
}

/**
 * Le pregunta a Meta el presupuesto diario y el estado de cada campana.
 *
 * Devuelve un mapa vacio si no se puede leer: **el que llama tiene que poder
 * distinguir "no hay presupuesto" de "no se pudo preguntar"**, y por eso el valor
 * queda sin definir en vez de en cero.
 */
async function leerConfiguracionDeCampanas(
  apiVersion: string,
  adAccountId: string,
  accessToken: string,
): Promise<Map<string, { dailyBudgetUYU?: number; activa: boolean }>> {
  const mapa = new Map<string, { dailyBudgetUYU?: number; activa: boolean }>();
  try {
    const url = new URL(`https://graph.facebook.com/${apiVersion}/act_${adAccountId}/campaigns`);
    url.searchParams.set('fields', 'id,name,daily_budget,status,effective_status');
    url.searchParams.set('limit', '500');
    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!respuesta.ok) return mapa;
    const datos = await respuesta.json() as { data?: Array<Record<string, unknown>> };
    for (const fila of Array.isArray(datos.data) ? datos.data : []) {
      const id = String(fila.id || '').trim();
      if (!id) continue;
      // Meta manda el presupuesto en centesimos de la moneda de la cuenta.
      const centesimos = Number(fila.daily_budget);
      const dailyBudgetUYU = Number.isFinite(centesimos) && centesimos > 0 ? centesimos / 100 : undefined;
      const estado = String(fila.effective_status || fila.status || '').toUpperCase();
      mapa.set(id, { dailyBudgetUYU, activa: estado === 'ACTIVE' });
    }
  } catch {
    // Sin datos de configuracion: el panel avisa que no esta verificado.
  }
  return mapa;
}

export interface MetaCommercialAIRecommendation {
  id: string;
  type: 'scaling' | 'optimization' | 'creative' | 'budget';
  title: string;
  message: string;
  impactLevel: 'alto' | 'medio' | 'sugerencia';
  targetCampaignId?: string;
}

function emptySummary(
  metrics: MetaCommercialMetrics,
  connectionStatus: MetaAdsSummary['connectionStatus'],
  connectionMessage: string,
): MetaAdsSummary {
  return {
    connectionStatus,
    connectionMessage,
    adCurrency: 'Sin datos',
    revenueCurrency: metrics.revenueCurrency,
    currencyComparable: false,
    totalSpend: 0,
    totalLeads: metrics.totalLeads,
    totalConversions: metrics.totalConversions,
    totalRevenue: metrics.totalRevenue,
    averageCpl: 0,
    overallRoas: null,
    reportedCampaignsCount: 0,
    topEventType: metrics.topEventType,
    campaigns: [],
  };
}

export async function getMetaAdsSummary(metrics: MetaCommercialMetrics): Promise<MetaAdsSummary> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_ADS_ACCOUNT_ID;
  if (!accessToken || !adAccountId) {
    return emptySummary(metrics, 'not_configured', 'Falta configurar la cuenta publicitaria o el token de Meta.');
  }

  try {
    const apiVersion = process.env.META_GRAPH_API_VERSION || 'v25.0';
    const fields = 'account_currency,campaign_id,campaign_name,spend,impressions,clicks,ctr';
    const url = new URL(`https://graph.facebook.com/${apiVersion}/act_${adAccountId}/insights`);
    url.searchParams.set('fields', fields);
    url.searchParams.set('date_preset', 'last_30d');
    url.searchParams.set('level', 'campaign');
    url.searchParams.set('limit', '500');
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return emptySummary(metrics, 'error', `Meta respondió con estado ${response.status}.`);
    }

    const payload = await response.json() as { data?: Array<Record<string, unknown>> };
    const rows = Array.isArray(payload.data) ? payload.data : [];

    /**
     * SEGUNDA CONSULTA: el presupuesto y el estado de cada campana.
     *
     * La consulta de arriba (`insights`) trae **lo que se gasto**, no lo que esta
     * configurado. El presupuesto diario y si la campana esta encendida viven en otra
     * puerta de Meta. Sin esto, el panel del tope no tiene con que trabajar y queda
     * diciendo "sin verificar" para siempre.
     *
     * Si esta consulta falla, no se rompe nada: las campanas quedan sin presupuesto
     * verificado y el panel lo dice. **Nunca se inventa un numero.**
     */
    const configuracion = await leerConfiguracionDeCampanas(apiVersion, adAccountId, accessToken);
    const adCurrency = String(rows[0]?.account_currency || 'Sin datos');
    const currencyComparable = adCurrency !== 'Sin datos' && adCurrency === metrics.revenueCurrency;
    let totalSpend = 0;

    const campaigns = rows.map((item, index): MetaAdCampaign => {
      const id = String(item.campaign_id || `campaign-${index}`);
      const name = String(item.campaign_name || 'Campaña sin nombre');
      const spend = Number(item.spend || 0);
      const impressions = Number(item.impressions || 0);
      const clicks = Number(item.clicks || 0);
      const commercial = metrics.campaigns[normalizeMetaCampaign(name)];
      const config = configuracion.get(id);
      const leadsCount = commercial?.leadsCount || 0;
      const conversionsCount = commercial?.conversionsCount || 0;
      const revenue = commercial?.revenue || 0;
      totalSpend += Number.isFinite(spend) ? spend : 0;

      return {
        id,
        name,
        spend,
        impressions,
        clicks,
        ctrPct: Number(item.ctr || (impressions > 0 ? (clicks / impressions) * 100 : 0)),
        cpl: leadsCount > 0 ? spend / leadsCount : 0,
        leadsCount,
        conversionsCount,
        revenue,
        roasRatio: currencyComparable && spend > 0 ? revenue / spend : null,
        dailyBudgetUYU: config?.dailyBudgetUYU,
        activa: config?.activa,
      };
    });

    return {
      connectionStatus: 'connected',
      adCurrency,
      revenueCurrency: metrics.revenueCurrency,
      currencyComparable,
      totalSpend,
      totalLeads: metrics.totalLeads,
      totalConversions: metrics.totalConversions,
      totalRevenue: metrics.totalRevenue,
      averageCpl: metrics.totalLeads > 0 ? totalSpend / metrics.totalLeads : 0,
      overallRoas: currencyComparable && totalSpend > 0 ? metrics.totalRevenue / totalSpend : null,
      reportedCampaignsCount: campaigns.length,
      topEventType: metrics.topEventType,
      campaigns,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar Meta.';
    return emptySummary(metrics, 'error', message);
  }
}

export function generateMetaCommercialAIRecommendations(summary: MetaAdsSummary): MetaCommercialAIRecommendation[] {
  if (summary.connectionStatus !== 'connected') {
    return [{
      id: 'rec-connection',
      type: 'optimization',
      title: 'Completar conexión con Meta Ads',
      message: summary.connectionMessage || 'No hay una conexión activa con Meta Ads.',
      impactLevel: 'alto',
    }];
  }
  if (summary.campaigns.length === 0) {
    return [{
      id: 'rec-no-data',
      type: 'optimization',
      title: 'Sin actividad publicitaria en los últimos 30 días',
      message: 'Meta no devolvió campañas para este período. No se generan recomendaciones sin datos.',
      impactLevel: 'sugerencia',
    }];
  }

  const recommendations: MetaCommercialAIRecommendation[] = [];
  const bestRoas = summary.campaigns
    .filter((campaign) => campaign.roasRatio !== null && campaign.conversionsCount > 0)
    .sort((a, b) => (b.roasRatio || 0) - (a.roasRatio || 0))[0];
  if (bestRoas) {
    recommendations.push({
      id: 'rec-best-roas',
      type: 'scaling',
      title: `Revisar crecimiento de "${bestRoas.name}"`,
      message: `Es la campaña con mejor retorno medido: ${bestRoas.roasRatio?.toFixed(2)}x, con ${bestRoas.conversionsCount} contratos atribuidos. Confirmá capacidad operativa antes de aumentar inversión.`,
      impactLevel: 'alto',
      targetCampaignId: bestRoas.id,
    });
  }

  const bestCtr = [...summary.campaigns].sort((a, b) => b.ctrPct - a.ctrPct)[0];
  if (bestCtr?.ctrPct > 0) {
    recommendations.push({
      id: 'rec-best-ctr',
      type: 'creative',
      title: `Analizar los creativos de "${bestCtr.name}"`,
      message: `Registró el CTR más alto del período (${bestCtr.ctrPct.toFixed(2)}%). Usá sus piezas como referencia y validá también contratos, no sólo clics.`,
      impactLevel: 'medio',
      targetCampaignId: bestCtr.id,
    });
  }

  if (!summary.currencyComparable) {
    recommendations.push({
      id: 'rec-currency',
      type: 'optimization',
      title: 'Unificar moneda para calcular ROAS',
      message: `Meta informa inversión en ${summary.adCurrency} y los presupuestos están en ${summary.revenueCurrency}. El ROAS queda oculto hasta contar con una conversión de moneda confiable.`,
      impactLevel: 'sugerencia',
    });
  }
  return recommendations;
}

function hashData(data?: string): string[] | undefined {
  if (!data) return undefined;
  return [crypto.createHash('sha256').update(data).digest('hex')];
}

export async function trackMetaConversionEvent(payload: {
  eventName: 'Lead' | 'Contact' | 'Schedule' | 'InitiateCheckout';
  email?: string;
  phone?: string;
  source?: string;
  valueUsd?: number;
}): Promise<{ success: boolean; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return { success: false, error: 'Meta credenciales no configuradas.' };

  try {
    const apiVersion = process.env.META_GRAPH_API_VERSION || 'v25.0';
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          event_name: payload.eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            em: hashData(payload.email?.trim().toLowerCase()),
            ph: hashData(payload.phone?.replace(/\D/g, '')),
          },
          custom_data: {
            currency: 'USD',
            value: payload.valueUsd ?? 0,
            content_name: payload.source ?? 'ak_lead',
          },
        }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return { success: response.ok, error: response.ok ? undefined : `Meta respondió ${response.status}.` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al enviar evento CAPI' };
  }
}
