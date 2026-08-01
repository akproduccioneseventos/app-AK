import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

export interface MetaCampaignCommercialMetric {
  name: string;
  leadsCount: number;
  conversionsCount: number;
  revenue: number;
}

export interface MetaCommercialMetrics {
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  revenueCurrency: string;
  topEventType?: string;
  campaigns: Record<string, MetaCampaignCommercialMetric>;
}

export function normalizeMetaCampaign(value?: string): string {
  return (value || 'sin-campana').trim().toLocaleLowerCase('es-UY');
}

function isMetaAttribution(attribution?: CommercialAttribution): boolean {
  if (!attribution) return false;
  if (attribution.source === 'facebook' || attribution.source === 'instagram') return true;
  const campaign = attribution.campaign?.toLowerCase() || '';
  return attribution.source === 'campaign' && /(meta|facebook|instagram)/.test(campaign);
}

function inRange(value: string | undefined, since: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= since;
}

function campaignName(attribution: CommercialAttribution): string {
  return attribution.campaign?.trim() || attribution.source;
}

export function buildMetaCommercialMetrics(
  leads: CrmLead[],
  budgets: Presupuesto[],
  options: { since: Date; revenueCurrency?: string },
): MetaCommercialMetrics {
  const campaigns: Record<string, MetaCampaignCommercialMetric> = {};
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const leadsByBudgetId = new Map(
    leads.filter((lead) => lead.presupuestoId).map((lead) => [lead.presupuestoId as string, lead]),
  );
  const ensureCampaign = (attribution: CommercialAttribution) => {
    const name = campaignName(attribution);
    const key = normalizeMetaCampaign(name);
    campaigns[key] ||= { name, leadsCount: 0, conversionsCount: 0, revenue: 0 };
    return campaigns[key];
  };

  for (const lead of leads) {
    if (!inRange(lead.createdAt, options.since) || !isMetaAttribution(lead.acquisition)) continue;
    ensureCampaign(lead.acquisition as CommercialAttribution).leadsCount += 1;
  }

  const eventTypeCounts = new Map<string, number>();
  for (const budget of budgets) {
    if (budget.archived || !['Aceptado', 'Facturado'].includes(budget.estado)) continue;
    if (!inRange(budget.fechaFirmaContrato || budget.timestamp, options.since)) continue;
    const linkedLead = (budget.leadId && leadsById.get(budget.leadId)) || leadsByBudgetId.get(budget.id);
    const attribution = budget.acquisition || linkedLead?.acquisition;
    if (!isMetaAttribution(attribution)) continue;

    const metric = ensureCampaign(attribution as CommercialAttribution);
    const revenue = Number(budget.totalConDescuento ?? budget.totalFinal ?? budget.costoTotalEstimado);
    metric.conversionsCount += 1;
    metric.revenue += Number.isFinite(revenue) && revenue > 0 ? revenue : 0;
    const eventType = budget.eventoTipo?.trim();
    if (eventType) eventTypeCounts.set(eventType, (eventTypeCounts.get(eventType) || 0) + 1);
  }

  const totals = Object.values(campaigns).reduce(
    (result, campaign) => ({
      leads: result.leads + campaign.leadsCount,
      conversions: result.conversions + campaign.conversionsCount,
      revenue: result.revenue + campaign.revenue,
    }),
    { leads: 0, conversions: 0, revenue: 0 },
  );
  const topEventType = [...eventTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalLeads: totals.leads,
    totalConversions: totals.conversions,
    totalRevenue: totals.revenue,
    revenueCurrency: options.revenueCurrency || 'UYU',
    topEventType,
    campaigns,
  };
}
