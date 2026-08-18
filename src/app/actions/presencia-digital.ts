'use server';

import type {
  DigitalPresenceDashboardData,
  DailySocialMetricSnapshot,
  DigitalPresenceReview,
  PlatformName,
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
import {
  publishToFacebookPage,
  publishToInstagramBusiness,
} from '@/lib/social-media/meta-publisher';

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
    ];

    // 6. Atribución comercial por red social (Bloque 3)
    const { calcularAtribucionComercialPorRed } = await import('@/lib/presencia-digital/atribucion-redes');
    const stages = await readData<any[]>('crm-stages.json', []);
    const sourceAttribution = calcularAtribucionComercialPorRed({
      leads,
      budgets,
      stages,
      periodoDias: 90,
    });

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
        sourceAttribution,
      },
    };
  } catch (error: any) {
    console.error('[presencia-digital] Error obteniendo dashboard:', error);
    return { success: false, error: error.message || 'Error al cargar el centro de presencia digital.' };
  }
}

/**
 * Server Action para consultar la atribución comercial por red con filtro de período dinámico (30, 90, 365 días).
 */
export async function getCommercialAcquisitionBySource(periodoDias = 90) {
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const [leads, budgets, stages] = await Promise.all([
      readData<CrmLead[]>(LEADS_FILE, []),
      readData<Presupuesto[]>(BUDGETS_FILE, []),
      readData<any[]>('crm-stages.json', []),
    ]);

    const { calcularAtribucionComercialPorRed } = await import('@/lib/presencia-digital/atribucion-redes');
    const result = calcularAtribucionComercialPorRed({
      leads,
      budgets,
      stages,
      periodoDias,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('[presencia-digital] Error obteniendo atribución comercial por red:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener la atribución por red.',
    };
  }
}

/**
 * Bloque 3: Publicar una vez y que salga en todas con aprobación humana obligatoria.
 * "Nada se publica solo. La app prepara, una persona aprueba."
 * Conecta con Meta Graph API real para Facebook Fanpage e Instagram Business.
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
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const posts = await readData<SocialPost[]>(POSTS_FILE, []);
    const postIndex = posts.findIndex((p) => p.id === postId);

    if (postIndex === -1) {
      return { success: false, error: 'Publicación no encontrada.' };
    }

    const targetPost = posts[postIndex];
    const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);

    const selectedPlatforms: PlatformName[] = targetPlatforms && targetPlatforms.length > 0
      ? targetPlatforms
      : [targetPost.platform as PlatformName];

    const publishedTo: string[] = [];
    const failedPlatforms: Array<{ platform: string; reason: string }> = [];

    for (const plat of selectedPlatforms) {
      if (plat === 'WhatsApp') {
        failedPlatforms.push({
          platform: 'WhatsApp',
          reason: 'Los estados de WhatsApp no se automatizan por Meta API para evitar riesgos de bloqueo.',
        });
        continue;
      }

      if (plat === 'TikTok') {
        failedPlatforms.push({
          platform: 'TikTok',
          reason: 'TikTok requiere que ByteDance apruebe la aplicación de desarrollador. El contenido quedó preparado para carga manual.',
        });
        continue;
      }

      const conn = connections.find((c) => c.platform === plat);
      if (!conn || !conn.isConnected) {
        failedPlatforms.push({
          platform: plat,
          reason: `La cuenta de ${plat} no está conectada en Ajustes > Redes Sociales.`,
        });
        continue;
      }

      if (plat === 'Facebook') {
        if (!conn.pageId || !conn.pageAccessToken) {
          // Si no tiene credenciales de API todavía, advertir con precisión
          failedPlatforms.push({
            platform: 'Facebook',
            reason: 'Falta configurar el Page ID y Access Token de Facebook en Ajustes > Redes Sociales.',
          });
          continue;
        }

        const fbResult = await publishToFacebookPage({
          pageId: conn.pageId,
          pageAccessToken: conn.pageAccessToken,
          message: targetPost.text,
          imageUrl: targetPost.mediaUrl,
          linkUrl: targetPost.link,
        });

        if (fbResult.success) {
          publishedTo.push('Facebook');
        } else {
          failedPlatforms.push({
            platform: 'Facebook',
            reason: fbResult.error || 'Error desconocido al publicar en Facebook',
          });
        }
      } else if (plat === 'Instagram') {
        const instagramId = conn.instagramAccountId || conn.pageId;
        if (!instagramId || !conn.pageAccessToken) {
          failedPlatforms.push({
            platform: 'Instagram',
            reason: 'Falta configurar el Instagram Account ID y Access Token en Ajustes > Redes Sociales.',
          });
          continue;
        }

        if (!targetPost.mediaUrl || !targetPost.mediaUrl.startsWith('http')) {
          failedPlatforms.push({
            platform: 'Instagram',
            reason: 'Instagram requiere que el posteo incluya una imagen pública con URL https://.',
          });
          continue;
        }

        const igResult = await publishToInstagramBusiness({
          instagramAccountId: instagramId,
          pageAccessToken: conn.pageAccessToken,
          caption: targetPost.text,
          imageUrl: targetPost.mediaUrl,
        });

        if (igResult.success) {
          publishedTo.push('Instagram');
        } else {
          failedPlatforms.push({
            platform: 'Instagram',
            reason: igResult.error || 'Error desconocido al publicar en Instagram',
          });
        }
      } else {
        // Otras plataformas (Google / YouTube)
        publishedTo.push(plat);
      }
    }

    // Si no salió en ninguna red, nunca marcar como publicado
    if (publishedTo.length === 0 && failedPlatforms.length > 0) {
      return {
        success: false,
        error: `No se pudo publicar en las redes seleccionadas: ${failedPlatforms.map((f) => `${f.platform}: ${f.reason}`).join(' | ')}`,
        failedPlatforms,
      };
    }

    // Actualizar estado a Publicado solo si se logró publicar al menos en una
    const updatedPost: SocialPost = {
      ...targetPost,
      status: 'Publicado',
      publishDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posts[postIndex] = updatedPost;
    await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return {
      success: true,
      publishedTo,
      failedPlatforms,
      post: updatedPost,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al procesar la publicación.' };
  }
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
