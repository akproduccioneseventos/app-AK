'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import {
  getStoredComments,
  getCommentsBackfillState,
  syncCommentsFromNetworks,
  restoreHiddenCommentInternal,
  hideCommentInternal,
  getAjustesRespuestasComentarios,
  setAjustesRespuestasComentarios,
  replyToCommentInternal,
  responderPendientesEnLoteInternal,
  type AjustesRespuestasComentarios,
} from '@/lib/social-media/comments-backfill';
import { saveTestimonial } from '@/app/actions/feedback';
import type {
  SocialComment,
  NetworkCommentsBackfillState,
  CommentNetwork,
  AutoReplyRule,
} from '@/types/comentarios-redes';
import type { CrmLead } from '@/types/crm';
import { readData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { mutarComentarios } from '@/lib/social-media/guardar-comentarios';

const COMMENTS_FILE = 'social-comments.json';
const LEADS_FILE = 'crm-leads.json';

export interface CommentsDashboardResponse {
  success: boolean;
  data?: {
    positiveComments: SocialComment[];
    autoHiddenComments: SocialComment[];
    legitimateComplaints: SocialComment[];
    allComments: SocialComment[];
    backfillState: Record<CommentNetwork, NetworkCommentsBackfillState>;
    autoReplySettings: AjustesRespuestasComentarios;
    summaryCounts: {
      total: number;
      positive: number;
      autoHidden: number;
      complaints: number;
      replied: number;
      pendingQuestions: number;
      whatsappSent: number;
      crmLeadsCreated: number;
    };
  };
  error?: string;
}

/**
 * Carga los comentarios agrupados y las reglas de contestación automática para el panel de presencia digital.
 */
export async function getSocialCommentsDashboardAction(): Promise<CommentsDashboardResponse> {
  try {
    await requireAppSession();

    const [comments, backfillState, autoReplySettings] = await Promise.all([
      getStoredComments(),
      getCommentsBackfillState(),
      getAjustesRespuestasComentarios(),
    ]);

    const visibleComments = comments.filter((c) => !c.isDeleted);

    const positiveComments = visibleComments.filter(
      (c) => c.sentiment === 'positivo' && !c.isAutoHidden
    );

    const autoHiddenComments = visibleComments.filter(
      (c) => c.isAutoHidden
    );

    const legitimateComplaints = visibleComments.filter(
      (c) => c.isLegitimateComplaint && !c.isAutoHidden
    );

    const replied = visibleComments.filter((c) => Boolean(c.respuestaAutomatica)).length;
    const pendingQuestions = visibleComments.filter(
      (c) => !c.isAutoHidden && !c.isInsultOrSpam && !c.respuestaAutomatica && Boolean(c.esPregunta)
    ).length;
    const whatsappSent = visibleComments.filter((c) => Boolean(c.whatsappEnviadoAt)).length;
    const crmLeadsCreated = visibleComments.filter((c) => Boolean(c.leadCreadoId)).length;

    return {
      success: true,
      data: {
        positiveComments,
        autoHiddenComments,
        legitimateComplaints,
        allComments: visibleComments,
        backfillState,
        autoReplySettings,
        summaryCounts: {
          total: visibleComments.length,
          positive: positiveComments.length,
          autoHidden: autoHiddenComments.length,
          complaints: legitimateComplaints.length,
          replied,
          pendingQuestions,
          whatsappSent,
          crmLeadsCreated,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener comentarios.' };
  }
}

/**
 * Dispara la sincronización manual o en tiempo real de comentarios.
 */
export async function triggerCommentsSyncAction(full: boolean = false) {
  try {
    await requireAppSession();

    const result = await syncCommentsFromNetworks({ full });
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al sincronizar comentarios.' };
  }
}

/**
 * Desoculta un comentario (volver a mostrarlo en la red con un toque).
 */
export async function restoreHiddenCommentAction(commentId: string) {
  try {
    await requireAppSession();

    return await restoreHiddenCommentInternal(commentId);
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al desocultar comentario.' };
  }
}

/**
 * Oculta un comentario manualmente en la red.
 */
export async function hideCommentAction(commentId: string) {
  try {
    await requireAppSession();

    return await hideCommentInternal(commentId);
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al ocultar comentario.' };
  }
}

/**
 * Guarda la configuración del contestador automático y las reglas por palabra clave.
 */
export async function saveAutoReplySettingsAction(settings: {
  activo?: boolean;
  whatsappNumero?: string;
  incluirLinkSimulador?: boolean;
  sincronizacionTiempoRealSegundos?: number;
  reglas?: AutoReplyRule[];
}) {
  try {
    await requireAppSession();
    const updated = await setAjustesRespuestasComentarios(settings);
    return { success: true, settings: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'No se pudo guardar la configuración de respuestas automáticas.',
    };
  }
}

/**
 * Responde un comentario individual desde la tabla unificada (con texto propio o regla/IA).
 */
export async function replyToSocialCommentAction(
  commentId: string,
  customMessage?: string
): Promise<{
  success: boolean;
  replyText?: string;
  publishedOnNetwork?: boolean;
  error?: string;
}> {
  try {
    await requireAppSession();
    return await replyToCommentInternal(commentId, customMessage);
  } catch (error: any) {
    return {
      success: false,
      publishedOnNetwork: false,
      error: error.message || 'No se pudo enviar la respuesta al comentario.',
    };
  }
}

/**
 * Ejecuta el contestador inteligente en lote para responder todas las consultas pendientes.
 */
export async function runBatchAutoReplyAction() {
  try {
    await requireAppSession();
    return await responderPendientesEnLoteInternal();
  } catch (error: any) {
    return {
      success: false,
      respondidosCount: 0,
      error: error.message || 'No se pudieron responder los comentarios pendientes.',
    };
  }
}

/**
 * Registra que se abrió/envió seguimiento por WhatsApp a partir de un comentario.
 */
export async function markCommentWhatsAppSentAction(commentId: string, authorPhone?: string) {
  try {
    await requireAppSession();
    const ahora = new Date().toISOString();
    const guardado = await mutarComentarios((lista) => {
      if (!lista.some((x) => x.id === commentId)) return null;
      return lista.map((x) =>
        x.id === commentId
          ? {
              ...x,
              whatsappEnviadoAt: ahora,
              authorPhone: authorPhone?.trim() || x.authorPhone,
            }
          : x
      );
    });
    if (!guardado) {
      return { success: false, error: 'No se encontró el comentario para anotar el WhatsApp.' };
    }
    return { success: true, whatsappEnviadoAt: ahora };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo anotar el envío de WhatsApp.' };
  }
}

/**
 * Convierte un comentario de cualquier red social en un Prospecto (Lead) del CRM con 1 clic.
 */
export async function createLeadFromCommentAction(commentId: string, authorPhone?: string) {
  try {
    await requireAppSession();

    const comments = await readData<SocialComment[]>(COMMENTS_FILE, []);
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) {
      return { success: false, error: 'Comentario no encontrado.' };
    }

    if (comment.leadCreadoId) {
      return {
        success: true,
        leadId: comment.leadCreadoId,
        alreadyExisted: true,
      };
    }

    const ahora = new Date().toISOString();
    const leadId = `lead_red_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const redOrigen = comment.canalOrigen || comment.network;

    const nuevoLead: CrmLead = {
      id: leadId,
      name: comment.authorName.replace(/^@/, '') || `Consulta de ${redOrigen}`,
      phone: (authorPhone || comment.authorPhone || '').trim(),
      currentStageId: 'stage_1',
      crmTags: [redOrigen],
      notes: `Creado desde comentario en ${redOrigen}: "${comment.text}"`,
      createdAt: ahora,
      updatedAt: ahora,
    };

    await mutateGenericJsonArray<CrmLead>(LEADS_FILE, (actuales) => [nuevoLead, ...actuales]);

    await mutarComentarios((lista) =>
      lista.map((x) =>
        x.id === commentId
          ? {
              ...x,
              leadCreadoId: leadId,
              authorPhone: nuevoLead.phone || x.authorPhone,
            }
          : x
      )
    );

    return {
      success: true,
      leadId,
      lead: nuevoLead,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'No se pudo crear el prospecto en el CRM.',
    };
  }
}

/**
 * Convierte un comentario bueno en testimonio público de la web.
 */
export async function publishCommentAsTestimonialAction(
  commentId: string,
  screenshotUrl?: string
) {
  try {
    await requireAppSession();

    const comments = await readData<SocialComment[]>(COMMENTS_FILE, []);
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx === -1) {
      return { success: false, error: 'Comentario no encontrado.' };
    }

    const c = comments[idx];

    // Crear y guardar testimonio en feedback.ts
    const testRes = await saveTestimonial({
      feedbackId: c.id,
      fiestaId: 'social_comment',
      fiestaNombre: `Comentario en ${c.network}`,
      clientName: c.authorName,
      testimonialText: c.text,
      screenshotUrl: screenshotUrl || c.testimonialScreenshotUrl,
    });

    if (!testRes.success) {
      return { success: false, error: testRes.error || 'No se pudo guardar como testimonio.' };
    }

    // El testimonio ya se guardo: se marca el comentario SOLO a el, sobre la lista de ahora
    // (la sincronizacion puede haber cambiado otros mientras tanto).
    const aprobadoEn = new Date().toISOString();
    const marcado = await mutarComentarios((lista) => {
      if (!lista.some((x) => x.id === commentId)) return null;
      return lista.map((x) => (x.id === commentId
        ? {
            ...x,
            isTestimonialApproved: true,
            testimonialScreenshotUrl: screenshotUrl || x.testimonialScreenshotUrl,
            approvedAsTestimonialAt: aprobadoEn,
          }
        : x));
    });
    if (!marcado) {
      return { success: false, error: 'El testimonio se guardó, pero el comentario ya no está en la lista para marcarlo.' };
    }

    return {
      success: true,
      testimonial: testRes.testimonial,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al publicar como testimonio.' };
  }
}

