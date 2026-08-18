'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import {
  getStoredComments,
  getCommentsBackfillState,
  syncCommentsFromNetworks,
  restoreHiddenCommentInternal,
  hideCommentInternal,
} from '@/lib/social-media/comments-backfill';
import { saveTestimonial } from '@/app/actions/feedback';
import type { SocialComment, NetworkCommentsBackfillState, CommentNetwork } from '@/types/comentarios-redes';
import { readData, writeData } from '@/lib/data-service';

const COMMENTS_FILE = 'social-comments.json';

export interface CommentsDashboardResponse {
  success: boolean;
  data?: {
    positiveComments: SocialComment[];
    autoHiddenComments: SocialComment[];
    legitimateComplaints: SocialComment[];
    allComments: SocialComment[];
    backfillState: Record<CommentNetwork, NetworkCommentsBackfillState>;
    summaryCounts: {
      total: number;
      positive: number;
      autoHidden: number;
      complaints: number;
    };
  };
  error?: string;
}

/**
 * Carga los comentarios agrupados para el panel de presencia digital.
 */
export async function getSocialCommentsDashboardAction(): Promise<CommentsDashboardResponse> {
  try {
    await requireAppSession();

    const comments = await getStoredComments();
    const backfillState = await getCommentsBackfillState();

    const positiveComments = comments.filter(
      (c) => c.sentiment === 'positivo' && !c.isAutoHidden && !c.isDeleted
    );

    const autoHiddenComments = comments.filter(
      (c) => c.isAutoHidden && !c.isDeleted
    );

    const legitimateComplaints = comments.filter(
      (c) => c.isLegitimateComplaint && !c.isAutoHidden && !c.isDeleted
    );

    return {
      success: true,
      data: {
        positiveComments,
        autoHiddenComments,
        legitimateComplaints,
        allComments: comments,
        backfillState,
        summaryCounts: {
          total: comments.length,
          positive: positiveComments.length,
          autoHidden: autoHiddenComments.length,
          complaints: legitimateComplaints.length,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener comentarios.' };
  }
}

/**
 * Dispara la sincronización manual de comentarios.
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

    c.isTestimonialApproved = true;
    c.testimonialScreenshotUrl = screenshotUrl || c.testimonialScreenshotUrl;
    c.approvedAsTestimonialAt = new Date().toISOString();

    await writeData(COMMENTS_FILE, comments);

    return {
      success: true,
      testimonial: testRes.testimonial,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al publicar como testimonio.' };
  }
}
