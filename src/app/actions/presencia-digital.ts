'use server';

import type {
  DigitalPresenceDashboardData,
  DailySocialMetricSnapshot,
  DigitalPresenceReview,
  PlatformName,
  NetworkAttributionPeriod,
  NetworkAttributionReport,
  NetworkAttributionRow,
} from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  buildDailySnapshots,
  calculateCommercialAdsRoi,
  HISTORY_FILE,
} from '@/lib/presencia-digital/metricas-historicas';
import { buildDigitalPresenceDailyReview } from '@/lib/presencia-digital/revision-diaria';
import { getMetaAdsSummary } from '@/lib/marketing/meta-ads';
import { buildMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics-core';
import { publishPostInternal } from '@/lib/presencia-digital/publicador';

const REVIEW_FILE = 'digital-presence-review.json';
const POSTS_FILE = 'social-posts.json';
const CONNECTIONS_FILE = 'social-connections.json';
const LEADS_FILE = 'crm-leads.json';
const BUDGETS_FILE = 'presupuestos.json';
const FIESTAS_FILE = 'fiestas.json';

/**
 * Obtiene todos los datos unificados para el Tablero del Centro de Presencia Digital (Bloque 1).
 */
export async function getDigitalPresenceDashboard(): Promise<{
  success: boolean;
  data?: DigitalPresenceDashboardData;
  error?: string;
}> {
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const [connections, posts, history, leads, budgets, fiestas, storedReview] = await Promise.all([
      readData<SocialConnection[]>(CONNECTIONS_FILE, []),
      readData<SocialPost[]>(POSTS_FILE, []),
      readData<DailySocialMetricSnapshot[]>(HISTORY_FILE, []),
      readData<CrmLead[]>(LEADS_FILE, []),
      readData<Presupuesto[]>(BUDGETS_FILE, []),
      readData<FiestaEnPlanificacion[]>(FIESTAS_FILE, []),
      readData<DigitalPresenceReview | null>(REVIEW_FILE, null),
    ]);

    // 1. Obtener datos de Meta Ads reales/calculados
    const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const metaMetrics = buildMetaCommercialMetrics(leads, budgets, { since: since30Days });
    const adsSummary = await getMetaAdsSummary(metaMetrics).catch(() => null);

    // 2. Calcular ROI comercial de anuncios vs Fiestas de verdad (Bloque 5)
    const commercialAdsRoi = calculateCommercialAdsRoi({
      adsSummary,
      leads,
      budgets,
      fiestas,
    });

    // 3. Obtener o generar la revisión diaria (Bloque 4)
    const todayStr = new Date().toISOString().split('T')[0];
    let review = storedReview;
    if (!review || review.date !== todayStr) {
      review = await buildDigitalPresenceDailyReview({ posts, connections });
      await writeData(REVIEW_FILE, review);
    }

    // 4. Guardar snapshot diario si hoy no se ha guardado (Bloque 2)
    const todayHasSnapshot = history.some((h) => h.date === todayStr);
    let updatedHistory = history;
    if (!todayHasSnapshot) {
      const newSnapshots = buildDailySnapshots({
        dateIso: todayStr,
        connections,
        posts,
        adsSummary,
        leadsCountToday: leads.filter((l) => l.createdAt?.startsWith(todayStr)).length,
        contractsCountToday: budgets.filter((b) => (b.fechaFirmaContrato || b.timestamp)?.startsWith(todayStr)).length,
        revenueToday: 0,
        existingSnapshots: history,
      });
      updatedHistory = [...history, ...newSnapshots];
      await writeData(HISTORY_FILE, updatedHistory);
    }

    // 5. Consolidar KPIs grandes para la vista móvil del dueño
    // Seguidores: no se inventan. Antes esto sumaba 1200 por cada red conectada
    // arrancando de 2450, todo puesto a ojo, y se mostraba igual que un dato
    // medido. Va `null` hasta que se lea de las estadisticas de Meta.
    const totalFollowers: number | null = null;
    const totalAdSpend = commercialAdsRoi.reduce((acc, c) => acc + c.spend, 0);
    const totalConversions = commercialAdsRoi.reduce((acc, c) => acc + c.conversionsCount, 0);
    const avgCostPerParty = totalConversions > 0 ? Math.round(totalAdSpend / totalConversions) : null;
    const pendingApprovalCount = posts.filter((p) => p.status === 'Borrador' || p.status === 'Programado').length;

    const platformsStatus: DigitalPresenceDashboardData['platformsStatus'] = [
      {
        platform: 'Instagram',
        isConnected: connections.some((c) => c.platform === 'Instagram' && c.isConnected),
        followers: null,
        daysWithoutPost: review?.inactivePlatforms.find((p) => p.platform === 'Instagram')?.daysWithoutPost || 1,
        canAutoPublish: true,
        publishNote: 'Publicación directa vía Graph API tras aprobación.',
      },
      {
        platform: 'Facebook',
        isConnected: connections.some((c) => c.platform === 'Facebook' && c.isConnected),
        followers: null,
        daysWithoutPost: review?.inactivePlatforms.find((p) => p.platform === 'Facebook')?.daysWithoutPost || 2,
        canAutoPublish: true,
        publishNote: 'Publicación en Fanpage tras aprobación.',
      },
      {
        platform: 'Google',
        isConnected: true,
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: true,
        publishNote: 'Actualización en Ficha de Google y Reseñas.',
      },
      {
        platform: 'TikTok',
        isConnected: connections.some((c) => c.platform === 'TikTok' && c.isConnected),
        followers: null,
        daysWithoutPost: review?.inactivePlatforms.find((p) => p.platform === 'TikTok')?.daysWithoutPost || 4,
        canAutoPublish: false,
        publishNote: 'Requiere aprobación de app por ByteDance. Queda listo para posteo manual.',
      },
      {
        platform: 'WhatsApp',
        isConnected: connections.some((c) => c.platform === 'WhatsApp' && c.isConnected),
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: false,
        publishNote: 'Los estados no se automatizan para proteger el número de la empresa.',
      },
      {
        platform: 'Pinterest',
        isConnected: connections.some((c) => c.platform === 'Pinterest' && c.isConnected),
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: false,
        publishNote: 'Listo para copiar. Ideal para tableros de decoración, centros de mesa y 15 años.',
      },
      {
        platform: 'Threads',
        isConnected: connections.some((c) => c.platform === 'Threads' && c.isConnected),
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: false,
        publishNote: 'Listo para copiar.',
      },
      {
        platform: 'X',
        isConnected: connections.some((c) => c.platform === 'X' && c.isConnected),
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: false,
        publishNote: 'Listo para copiar.',
      },
    ];

    // Cargar métricas de la web desde Google Analytics 4
    const { getGoogleAnalyticsMetrics } = await import('@/lib/presencia-digital/google-analytics');
    const websiteAnalytics = await getGoogleAnalyticsMetrics(30);

    return {
      success: true,
      data: {
        kpis: {
          totalFollowers,
          followersWeeklyChange: null,
          weeklyReach: null,
          reachWeeklyChangePct: null,
          activeAdSpendMonth: totalAdSpend,
          signedPartiesFromAds: totalConversions,
          averageCostPerSignedParty: avgCostPerParty,
          pendingApprovalPostsCount: pendingApprovalCount,
          googleRating: null,
          googleReviewsCount: null,
        },
        commercialAdsRoi,
        review,
        recentHistory: updatedHistory.slice(-30),
        platformsStatus,
        websiteAnalytics,
      },
    };
  } catch (error: any) {
    console.error('[presencia-digital] Error obteniendo dashboard:', error);
    return { success: false, error: error.message || 'Error al cargar el centro de presencia digital.' };
  }
}

/**
 * Server Action para consultar Google Analytics 4 con filtro de período dinámico (7, 30, 90 días).
 */
export async function getWebsiteAnalyticsData(periodoDias: number = 30) {
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const { getGoogleAnalyticsMetrics } = await import('@/lib/presencia-digital/google-analytics');
    const data = await getGoogleAnalyticsMetrics(periodoDias);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('[presencia-digital] Error obteniendo analítica web:', error);
    return {
      success: false,
      error: error.message || 'Error al consultar Google Analytics.',
    };
  }
}

/**
 * Bloque 3: Publicar una vez y que salga en todas con aprobación humana obligatoria.
 * "Nada se publica solo. La app prepara, una persona aprueba."
 */
export async function publishApprovedSocialPost(
  postId: string,
  targetPlatforms?: PlatformName[]
): Promise<{
  success: boolean;
  publishedTo?: string[];
  failedPlatforms?: Array<{ platform: string; reason: string }>;
  post?: SocialPost;
  error?: string;
}> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };

  return publishPostInternal(postId, targetPlatforms);
}

/**
 * Bloque 4: Crear una publicación en borrador directamente desde la sugerencia diaria en 1 toque.
 */
export async function createPostFromDailySuggestion(
  suggestionText: string,
  platform: 'Instagram' | 'Facebook' = 'Instagram'
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const posts = await readData<SocialPost[]>(POSTS_FILE, []);
    const newPost: SocialPost = {
      id: `sug_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      platform,
      isGeneralCampaign: true,
      publishDate: new Date().toISOString(),
      text: suggestionText,
      status: 'Borrador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posts.unshift(newPost);
    await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return { success: true, post: newPost };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al crear la publicación sugerida.' };
  }
}

/**
 * BLOQUE 3 (Orden del 18 de agosto): Reporte de atribución por red social.
 * Muestra qué red trae clientes de verdad (consultas, presupuestos, contratos y facturación).
 * NO inventa números: si de una red no vino nadie, muestra 0 y el cartel explícito.
 */
export async function getNetworkAttributionReport(
  period: NetworkAttributionPeriod = '90d'
): Promise<{ success: boolean; data?: NetworkAttributionReport; error?: string }> {
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const [leads, budgets] = await Promise.all([
      readData<CrmLead[]>(LEADS_FILE, []),
      readData<Presupuesto[]>(BUDGETS_FILE, []),
    ]);

    // Determinar fecha de corte según el período
    const now = Date.now();
    let cutoffDate: Date;
    let periodDaysText = 'estos 90 días';
    let periodLabel = 'Últimos 90 días';

    if (period === '30d') {
      cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      periodDaysText = 'estos 30 días';
      periodLabel = 'Últimos 30 días';
    } else if (period === 'year') {
      const currentYear = new Date().getFullYear();
      cutoffDate = new Date(currentYear, 0, 1);
      periodDaysText = `este año ${currentYear}`;
      periodLabel = `Año ${currentYear}`;
    } else if (period === 'all') {
      cutoffDate = new Date(0);
      periodDaysText = 'todo el historial';
      periodLabel = 'Historial completo';
    } else {
      cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      periodDaysText = 'estos 90 días';
      periodLabel = 'Últimos 90 días';
    }

    // Filtrar leads dentro del período
    const periodLeads = leads.filter((lead) => {
      if (!lead.createdAt) return true;
      const leadDate = new Date(lead.createdAt);
      return leadDate >= cutoffDate;
    });

    // Definición de las redes auditadas obligatorias
    const networksConfig = [
      { key: 'instagram', name: 'Instagram', match: (s: string) => s === 'instagram' },
      { key: 'facebook', name: 'Facebook', match: (s: string) => s === 'facebook' },
      { key: 'tiktok', name: 'TikTok', match: (s: string) => s === 'tiktok' },
      { key: 'youtube', name: 'YouTube', match: (s: string) => s === 'youtube' },
      { key: 'whatsapp', name: 'WhatsApp', match: (s: string) => s === 'whatsapp' },
      {
        key: 'web_directo',
        name: 'Web / Directo',
        match: (s: string) =>
          ['direct', 'landing', 'landing_bodas', 'landing_xv', 'landing_eventos', 'portal_led', 'campaign', 'guest_portal'].includes(s),
      },
      {
        key: 'otros',
        name: 'Otras fuentes',
        match: (s: string) =>
          !['instagram', 'facebook', 'tiktok', 'youtube', 'whatsapp', 'direct', 'landing', 'landing_bodas', 'landing_xv', 'landing_eventos', 'portal_led', 'campaign', 'guest_portal'].includes(s),
      },
    ];

    const rows: NetworkAttributionRow[] = [];
    let totalConsultas = 0;
    let totalPresupuestos = 0;
    let totalContratados = 0;
    let totalRevenueUYU = 0;

    for (const net of networksConfig) {
      const netLeads = periodLeads.filter((l) => {
        const src = (l.acquisition?.source || 'direct').toLowerCase();
        return net.match(src);
      });

      const consultasCount = netLeads.length;
      let presupuestosCount = 0;
      let contratadosCount = 0;
      let netRevenue = 0;

      for (const lead of netLeads) {
        // Buscar presupuesto vinculado
        const budget = budgets.find((b) =>
          b.id === lead.presupuestoId ||
          (b.clienteNombre && lead.name && b.clienteNombre.toLowerCase() === lead.name.toLowerCase()) ||
          (b.clienteContacto && lead.phone && b.clienteContacto.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''))
        );

        const hasBudget = Boolean(lead.presupuestoId || lead.presupuestoEstado || budget);
        if (hasBudget) {
          presupuestosCount += 1;
        }

        const isContracted =
          lead.presupuestoEstado === 'Aceptado' ||
          lead.presupuestoEstado === 'Facturado' ||
          Boolean(lead.invoiceId) ||
          (budget && (budget.estado === 'Aceptado' || budget.estado === 'Facturado' || Boolean(budget.fechaFirmaContrato)));

        if (isContracted) {
          contratadosCount += 1;
          const monto = budget?.totalConDescuento ?? budget?.costoTotalEstimado ?? 0;
          netRevenue += monto;
        }
      }

      totalConsultas += consultasCount;
      totalPresupuestos += presupuestosCount;
      totalContratados += contratadosCount;
      totalRevenueUYU += netRevenue;

      let inactivityNote: string | undefined;
      if (consultasCount === 0) {
        inactivityNote = `De ${net.name} no vino ninguna consulta en ${periodDaysText}.`;
      }

      rows.push({
        network: net.name,
        sourceKey: net.key,
        consultasCount,
        presupuestosCount,
        contratadosCount,
        totalRevenueUYU: netRevenue,
        inactivityNote,
      });
    }

    return {
      success: true,
      data: {
        period,
        periodLabel,
        rows,
        totalConsultas,
        totalPresupuestos,
        totalContratados,
        totalRevenueUYU,
      },
    };
  } catch (error: any) {
    console.error('[presencia-digital] Error generando reporte de atribución:', error);
    return { success: false, error: error.message || 'Error al generar reporte de atribución.' };
  }
}

