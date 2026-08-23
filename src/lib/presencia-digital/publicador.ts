/**
 * El publicador de redes: quien de verdad manda el posteo a Facebook e Instagram.
 *
 * Por que vive aca y no en `src/app/actions`: todo lo que se exporta desde un
 * archivo de acciones queda abierto al publico. Este ejecutor no pide permiso
 * (la tarea programada no tiene sesion), asi que exportarlo desde una accion
 * dejaba publicar en las redes de la empresa a cualquiera de afuera. Aca adentro
 * lo usan la accion `publishApprovedSocialPost` (que si pide permiso) y la tarea
 * programada, y nadie mas.
 */

import type { PlatformName } from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import { readData, writeData } from '@/lib/data-service';
import {
  publishToFacebookPage,
  publishToInstagramBusiness,
} from '@/lib/social-media/meta-publisher';
import { publishToTikTok } from '@/lib/social-media/tiktok-publisher';
import { publishToYouTube } from '@/lib/social-media/youtube-publisher';
import { publishToGoogleBusiness } from '@/lib/social-media/google-business-publisher';
import { publishToPinterest } from '@/lib/social-media/pinterest-publisher';
import { publishToThreads } from '@/lib/social-media/threads-publisher';
import { publishToX } from '@/lib/social-media/x-publisher';
import { publishToUnifiedGateway } from '@/lib/social-media/unified-gateway-publisher';

const POSTS_FILE = 'social-posts.json';
const CONNECTIONS_FILE = 'social-connections.json';
const MAX_POR_CORRIDA_DEFAULT = 3;

/**
 * Ejecutor interno de publicación de posteos sociales.
 * No requiere sesión interactiva para poder ser invocado de forma desatendida por el cron.
 * Conecta con APIs oficiales gratuitas (Meta, TikTok, YouTube, Google, Pinterest, Threads, X)
 * y pasarela unificada (n8n, Make, Upload-Post, Postiz).
 * Si no hay credenciales directas, marca el posteo como 'Listo para copiar' con atajos de 1 toque.
 */
export async function publishPostInternal(
  postId: string,
  targetPlatforms?: PlatformName[]
): Promise<{
  success: boolean;
  publishedTo?: string[];
  failedPlatforms?: Array<{ platform: string; reason: string }>;
  readyForManualCopy?: boolean;
  post?: SocialPost;
  error?: string;
}> {
  try {
    const posts = await readData<SocialPost[]>(POSTS_FILE, []);
    const postIndex = posts.findIndex((p) => p.id === postId);

    if (postIndex === -1) {
      return { success: false, error: 'Publicación no encontrada.' };
    }

    const targetPost = posts[postIndex];

    if ((!targetPlatforms || targetPlatforms.length === 0) && targetPost.status === 'Publicado') {
      return { success: true, publishedTo: [], post: targetPost };
    }

    const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);

    const selectedPlatforms: PlatformName[] = targetPlatforms && targetPlatforms.length > 0
      ? targetPlatforms
      : [targetPost.platform as PlatformName];

    // Verificar si hay una pasarela / webhook unificado configurado (Camino B)
    const unifiedConn = connections.find((c) => c.webhookUrl && c.isConnected);
    if (unifiedConn?.webhookUrl) {
      const unifiedRes = await publishToUnifiedGateway({
        webhookUrl: unifiedConn.webhookUrl,
        apiKey: unifiedConn.apiKey,
        post: targetPost,
        targetPlatforms: selectedPlatforms,
      });
      if (unifiedRes.success) {
        const updatedPost: SocialPost = {
          ...targetPost,
          status: 'Publicado',
          publishDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastError: undefined,
        };
        posts[postIndex] = updatedPost;
        await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        return {
          success: true,
          publishedTo: unifiedRes.publishedTo || selectedPlatforms,
          post: updatedPost,
        };
      }
    }

    const publishedTo: string[] = [];
    const failedPlatforms: Array<{ platform: string; reason: string }> = [];
    let isOnlyManualNetworks = true;

    for (const plat of selectedPlatforms) {
      const conn = connections.find((c) => c.platform === plat);

      // WhatsApp es por naturaleza canal de estados/chat: queda listo para 1 toque
      if (plat === 'WhatsApp') {
        failedPlatforms.push({
          platform: 'WhatsApp',
          reason: 'Los estados de WhatsApp quedan listos para publicar en 1 toque desde la app.',
        });
        continue;
      }

      if (plat === 'Facebook') {
        if (!conn?.pageId || !conn?.pageAccessToken) {
          failedPlatforms.push({
            platform: 'Facebook',
            reason: 'Falta configurar el Page ID y Access Token de Facebook en Ajustes > Redes Sociales (o usar botón de 1 toque).',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const fbResult = await publishToFacebookPage({
          pageId: conn.pageId,
          pageAccessToken: conn.pageAccessToken,
          message: targetPost.text,
          imageUrl: targetPost.mediaUrl,
          linkUrl: targetPost.link,
        });

        if (fbResult.success) publishedTo.push('Facebook');
        else failedPlatforms.push({ platform: 'Facebook', reason: fbResult.error || 'Error en Facebook' });

      } else if (plat === 'Instagram') {
        const instagramId = conn?.instagramAccountId || conn?.pageId;
        if (!instagramId || !conn?.pageAccessToken) {
          failedPlatforms.push({
            platform: 'Instagram',
            reason: 'Falta configurar el Instagram Account ID y Access Token en Ajustes > Redes Sociales (o usar botón de 1 toque).',
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

        isOnlyManualNetworks = false;
        const igResult = await publishToInstagramBusiness({
          instagramAccountId: instagramId,
          pageAccessToken: conn.pageAccessToken,
          caption: targetPost.text,
          imageUrl: targetPost.mediaUrl,
        });

        if (igResult.success) publishedTo.push('Instagram');
        else failedPlatforms.push({ platform: 'Instagram', reason: igResult.error || 'Error en Instagram' });

      } else if (plat === 'TikTok') {
        if (!conn?.accessToken) {
          failedPlatforms.push({
            platform: 'TikTok',
            reason: 'Falta el Access Token de TikTok en Ajustes > Redes Sociales. Podés publicar con el botón de 1 Toque.',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const ttResult = await publishToTikTok({
          accessToken: conn.accessToken,
          videoUrl: targetPost.mediaUrl,
          title: targetPost.text,
        });

        if (ttResult.success) publishedTo.push('TikTok');
        else failedPlatforms.push({ platform: 'TikTok', reason: ttResult.error || 'Error en TikTok' });

      } else if (plat === 'YouTube') {
        if (!conn?.accessToken) {
          failedPlatforms.push({
            platform: 'YouTube',
            reason: 'Falta el Access Token de Google/YouTube en Ajustes > Redes Sociales. Podés publicar con el botón de 1 Toque.',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const ytResult = await publishToYouTube({
          accessToken: conn.accessToken,
          videoUrl: targetPost.mediaUrl || '',
          title: targetPost.text.slice(0, 80),
          description: targetPost.text,
        });

        if (ytResult.success) publishedTo.push('YouTube');
        else failedPlatforms.push({ platform: 'YouTube', reason: ytResult.error || 'Error en YouTube' });

      } else if (plat === 'Google') {
        if (!conn?.accessToken || !conn?.locationId) {
          failedPlatforms.push({
            platform: 'Google',
            reason: 'Falta el Token y Location ID de Google Business en Ajustes > Redes Sociales.',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const gbResult = await publishToGoogleBusiness({
          accessToken: conn.accessToken,
          accountLocationId: conn.locationId,
          summary: targetPost.text,
          callToActionUrl: targetPost.link,
          imageUrl: targetPost.mediaUrl,
        });

        if (gbResult.success) publishedTo.push('Google');
        else failedPlatforms.push({ platform: 'Google', reason: gbResult.error || 'Error en Google Business' });

      } else if (plat === 'Pinterest') {
        if (!conn?.accessToken || !conn?.boardId || !targetPost.mediaUrl) {
          failedPlatforms.push({
            platform: 'Pinterest',
            reason: 'Falta Token/Board ID o imagen para Pinterest en Ajustes > Redes Sociales.',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const pinResult = await publishToPinterest({
          accessToken: conn.accessToken,
          boardId: conn.boardId,
          title: targetPost.text.slice(0, 80),
          description: targetPost.text,
          link: targetPost.link,
          imageUrl: targetPost.mediaUrl,
        });

        if (pinResult.success) publishedTo.push('Pinterest');
        else failedPlatforms.push({ platform: 'Pinterest', reason: pinResult.error || 'Error en Pinterest' });

      } else if (plat === 'Threads') {
        if (!conn?.accessToken || !conn?.pageId) {
          failedPlatforms.push({
            platform: 'Threads',
            reason: 'Falta el Token y User ID de Threads en Ajustes > Redes Sociales.',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const thResult = await publishToThreads({
          accessToken: conn.accessToken,
          threadsUserId: conn.pageId,
          text: targetPost.text,
          imageUrl: targetPost.mediaType === 'image' ? targetPost.mediaUrl : undefined,
          videoUrl: targetPost.mediaType === 'video' ? targetPost.mediaUrl : undefined,
        });

        if (thResult.success) publishedTo.push('Threads');
        else failedPlatforms.push({ platform: 'Threads', reason: thResult.error || 'Error en Threads' });

      } else if (plat === 'X') {
        if (!conn?.accessToken && !conn?.apiKey) {
          failedPlatforms.push({
            platform: 'X',
            reason: 'Falta el Token de X (Twitter) en Ajustes > Redes Sociales. Podés publicar con 1 Toque.',
          });
          continue;
        }

        isOnlyManualNetworks = false;
        const xResult = await publishToX({
          accessToken: conn.accessToken,
          bearerToken: conn.apiKey,
          text: targetPost.text,
        });

        if (xResult.success) publishedTo.push('X');
        else failedPlatforms.push({ platform: 'X', reason: xResult.error || 'Error en X' });

      } else {
        publishedTo.push(plat);
      }
    }

    // Si todas las redes seleccionadas son manuales (TikTok, Threads, X, WhatsApp)
    if (isOnlyManualNetworks && publishedTo.length === 0) {
      const manualPost: SocialPost = {
        ...targetPost,
        status: 'Listo para copiar',
        updatedAt: new Date().toISOString(),
      };
      posts[postIndex] = manualPost;
      await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      return {
        success: true,
        readyForManualCopy: true,
        post: manualPost,
        failedPlatforms,
      };
    }

    // Si fallaron todas las redes automáticas
    if (publishedTo.length === 0 && failedPlatforms.length > 0) {
      const errorMsg = failedPlatforms.map((f) => `${f.platform}: ${f.reason}`).join(' | ');
      const failedRetryCount = (targetPost.retryCount || 0) + 1;
      const willMarkFailed = failedRetryCount >= 3;

      const updatedFailedPost: SocialPost = {
        ...targetPost,
        retryCount: failedRetryCount,
        lastError: errorMsg,
        lastAttemptAt: new Date().toISOString(),
        status: willMarkFailed ? 'Falló' : targetPost.status,
        updatedAt: new Date().toISOString(),
      };

      posts[postIndex] = updatedFailedPost;
      await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

      return {
        success: false,
        error: `No se pudo publicar en las redes seleccionadas: ${errorMsg}`,
        failedPlatforms,
        post: updatedFailedPost,
      };
    }

    // Actualizar estado a Publicado solo si se logró publicar al menos en una red
    const updatedPost: SocialPost = {
      ...targetPost,
      status: 'Publicado',
      publishDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastError: undefined,
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


export interface CronPublicarResult {
  ok: boolean;
  totalPendientes: number;
  procesados: number;
  publicados: string[];
  listosParaCopiar: string[];
  fallados: Array<{ id: string; error: string }>;
  omitidosPorTope: number;
}

/**
 * Función principal que procesa la cola de posteos programados.
 * Es exportada para permitir pruebas unitarias directas sin depender de HTTP.
 *
 * Reglas de negocio:
 * 1. Solo procesa posteos con status 'Programado' cuya publishDate ya haya pasado (<= ahora).
 * 2. Tope de 3 por corrida: si el servidor estuvo caído, no vacía la cola de golpe para no saturar las redes.
 * 3. Máximo 3 intentos por posteo; si falla 3 veces queda marcado como 'Falló'.
 * 4. Las redes manuales (TikTok, Threads, X, WhatsApp) se marcan como 'Listo para copiar'.
 */
export async function procesarPosteosProgramados(
  maxPorCorrida = MAX_POR_CORRIDA_DEFAULT,
  ahora = new Date()
): Promise<CronPublicarResult> {
  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  const ahoraTime = ahora.getTime();

  // Filtrar posteos programados cuya fecha ya venció
  const programadosVencidos = posts.filter((p) => {
    if (p.status !== 'Programado') return false;
    if (!p.publishDate) return false;
    const pubTime = new Date(p.publishDate).getTime();
    return !Number.isNaN(pubTime) && pubTime <= ahoraTime;
  });

  // Ordenar los más viejos primero para respetar el orden cronológico
  programadosVencidos.sort(
    (a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  );

  const aProcesar = programadosVencidos.slice(0, maxPorCorrida);
  const omitidosPorTope = Math.max(0, programadosVencidos.length - maxPorCorrida);

  const publicados: string[] = [];
  const listosParaCopiar: string[] = [];
  const fallados: Array<{ id: string; error: string }> = [];

  for (const post of aProcesar) {
    // Se vuelve a leer justo antes de publicar. La lista de arriba se armo al
    // empezar la vuelta, y para cuando llega el turno de este posteo otra pestana
    // del equipo pudo haberlo publicado ya. Sin esto, el mismo posteo sale dos
    // veces en las redes de la empresa.
    const frescos = await readData<SocialPost[]>(POSTS_FILE, []);
    const alDia = frescos.find((p) => p.id === post.id);
    if (!alDia || alDia.status !== 'Programado') continue;

    const res = await publishPostInternal(post.id);

    if (res.success) {
      if (res.readyForManualCopy) {
        listosParaCopiar.push(post.id);
      } else {
        publicados.push(post.id);
      }
    } else {
      fallados.push({
        id: post.id,
        error: res.error || 'Error al procesar la publicación programada',
      });
    }
  }

  return {
    ok: true,
    totalPendientes: programadosVencidos.length,
    procesados: aProcesar.length,
    publicados,
    listosParaCopiar,
    fallados,
    omitidosPorTope,
  };
}
