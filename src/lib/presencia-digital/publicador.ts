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

const POSTS_FILE = 'social-posts.json';
const CONNECTIONS_FILE = 'social-connections.json';
const MAX_POR_CORRIDA_DEFAULT = 3;

/**
 * Ejecutor interno de publicación de posteos sociales.
 * No requiere sesión interactiva para poder ser invocado de forma desatendida por el cron.
 * Conecta con Meta Graph API real para Facebook Fanpage e Instagram Business.
 * Para redes manuales (WhatsApp, TikTok, Threads, X), marca el posteo como 'Listo para copiar'.
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

    // Un posteo que ya salio no vuelve a salir.
    //
    // Antes esto lo cuidaba el hecho de que los posteos programados los mandaba un
    // solo disparador. Ahora los manda el navegador del equipo, asi que dos
    // pestanas abiertas a la vez pueden pedir el mismo posteo y publicarlo dos
    // veces en el Instagram y el Facebook de la empresa.
    //
    // La comprobacion se saltea cuando se piden redes puntuales (`targetPlatforms`),
    // que es el caso de publicar a mano en una red que quedo afuera de la primera
    // vuelta: ahi si es a proposito.
    if ((!targetPlatforms || targetPlatforms.length === 0) && targetPost.status === 'Publicado') {
      return { success: true, publishedTo: [], post: targetPost };
    }

    const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);

    const selectedPlatforms: PlatformName[] = targetPlatforms && targetPlatforms.length > 0
      ? targetPlatforms
      : [targetPost.platform as PlatformName];

    const publishedTo: string[] = [];
    const failedPlatforms: Array<{ platform: string; reason: string }> = [];
    let isOnlyManualNetworks = true;

    for (const plat of selectedPlatforms) {
      if (plat === 'WhatsApp' || plat === 'TikTok' || plat === 'Pinterest' || plat === 'Threads' || plat === 'X') {
        // Redes que se gestionan en modo "Listo para copiar" (no automatizables por API directa)
        failedPlatforms.push({
          platform: plat,
          reason: plat === 'WhatsApp'
            ? 'Los estados de WhatsApp no se automatizan por Meta API. Queda listo para copiar y pegar.'
            : plat === 'TikTok'
              ? 'TikTok requiere aplicación de desarrollador aprobada por ByteDance. Queda listo para subir manual.'
              : plat === 'Pinterest'
                ? 'Pinterest requiere aprobación de app para publicar por API. Queda listo para copiar tu foto y descripción.'
                : `${plat} requiere publicación manual. Queda listo para copiar y subir.`,
        });
        continue;
      }

      isOnlyManualNetworks = false;
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
        // Otras plataformas
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
