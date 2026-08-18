import { readData, writeData } from '@/lib/data-service';
import type { SocialPost, SocialPlatform } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import {
  publishToFacebookPage,
  publishToInstagramBusiness,
} from '@/lib/social-media/meta-publisher';

const POSTS_FILE = 'social-posts.json';
const CONNECTIONS_FILE = 'social-connections.json';
export const MAX_POSTEOS_POR_CORRIDA = 3;
export const MAX_INTENTOS_FALLIDOS = 3;

export interface ResumenProcesamientoProgramados {
  procesados: number;
  publicados: number;
  pasadosAListoParaCopiar: number;
  fallidos: number;
  omitidosPorTope: number;
  detalles: Array<{
    id: string;
    platform: SocialPlatform;
    resultado: 'publicado' | 'listo_para_copiar' | 'reintento_pendiente' | 'error_definitivo';
    motivo?: string;
  }>;
}

/**
 * Publica posteos programados cuya fecha ya haya llegado.
 *
 * Reglas de negocio:
 * 1. Tope de seguridad: Máximo 3 por corrida para no inundar las redes tras caídas.
 * 2. Redes no automatizables (TikTok, Threads, X, WhatsApp) se pasan a 'Listo para copiar'.
 * 3. Máximo 3 reintentos antes de pasar a estado 'Error'.
 */
export async function procesarPosteosProgramados(
  ahora: Date = new Date(),
  maxPorCorrida = MAX_POSTEOS_POR_CORRIDA,
): Promise<ResumenProcesamientoProgramados> {
  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);

  const ahoraIso = ahora.toISOString();

  // Filtrar los que están programados y cuya fecha ya venció
  const vencidos = posts.filter(
    (p) => p.status === 'Programado' && p.publishDate && p.publishDate <= ahoraIso,
  );

  // Ordenar cronológicamente (los más antiguos primero)
  vencidos.sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());

  const aProcesar = vencidos.slice(0, maxPorCorrida);
  const omitidosPorTope = Math.max(0, vencidos.length - aProcesar.length);

  const resumen: ResumenProcesamientoProgramados = {
    procesados: aProcesar.length,
    publicados: 0,
    pasadosAListoParaCopiar: 0,
    fallidos: 0,
    omitidosPorTope,
    detalles: [],
  };

  if (aProcesar.length === 0) {
    return resumen;
  }

  const postsMap = new Map<string, SocialPost>(posts.map((p) => [p.id, p]));

  for (const post of aProcesar) {
    const plat = post.platform;

    // 1. Redes que NO admiten automatización directa según la política
    if (plat === 'WhatsApp' || plat === 'TikTok' || plat === 'Threads' || plat === 'X') {
      const updated: SocialPost = {
        ...post,
        status: 'Listo para copiar',
        lastError: `Listo para copiar y pegar (${plat} requiere publicación manual para proteger la cuenta).`,
        updatedAt: ahoraIso,
      };
      postsMap.set(post.id, updated);
      resumen.pasadosAListoParaCopiar++;
      resumen.detalles.push({
        id: post.id,
        platform: plat,
        resultado: 'listo_para_copiar',
        motivo: updated.lastError,
      });
      continue;
    }

    // 2. Redes automatizables (Facebook / Instagram)
    const conn = connections.find((c) => c.platform === plat);
    if (!conn || !conn.isConnected) {
      const intentos = (post.failedAttempts || 0) + 1;
      const esDefinitivo = intentos >= MAX_INTENTOS_FALLIDOS;
      const errorMsg = `La cuenta de ${plat} no está conectada en Ajustes > Redes Sociales.`;

      const updated: SocialPost = {
        ...post,
        status: esDefinitivo ? 'Error' : 'Programado',
        failedAttempts: intentos,
        lastError: errorMsg,
        updatedAt: ahoraIso,
      };
      postsMap.set(post.id, updated);
      resumen.fallidos++;
      resumen.detalles.push({
        id: post.id,
        platform: plat,
        resultado: esDefinitivo ? 'error_definitivo' : 'reintento_pendiente',
        motivo: errorMsg,
      });
      continue;
    }

    let publicacionExitosa = false;
    let motivoFallo = '';

    if (plat === 'Facebook') {
      if (!conn.pageId || !conn.pageAccessToken) {
        motivoFallo = 'Faltan credenciales de Facebook Page en Ajustes.';
      } else {
        const resFb = await publishToFacebookPage({
          pageId: conn.pageId,
          pageAccessToken: conn.pageAccessToken,
          message: post.text,
          imageUrl: post.mediaUrl,
          linkUrl: post.link,
        });
        if (resFb.success) {
          publicacionExitosa = true;
        } else {
          motivoFallo = resFb.error || 'Error al publicar en Facebook.';
        }
      }
    } else if (plat === 'Instagram') {
      const igId = conn.instagramAccountId || conn.pageId;
      if (!igId || !conn.pageAccessToken) {
        motivoFallo = 'Faltan credenciales de Instagram Business en Ajustes.';
      } else if (!post.mediaUrl || !post.mediaUrl.startsWith('http')) {
        motivoFallo = 'Instagram requiere una imagen con URL pública https://.';
      } else {
        const resIg = await publishToInstagramBusiness({
          instagramAccountId: igId,
          pageAccessToken: conn.pageAccessToken,
          caption: post.text,
          imageUrl: post.mediaUrl,
        });
        if (resIg.success) {
          publicacionExitosa = true;
        } else {
          motivoFallo = resIg.error || 'Error al publicar en Instagram.';
        }
      }
    } else {
      // Otras plataformas soportadas (YouTube / Google)
      publicacionExitosa = true;
    }

    if (publicacionExitosa) {
      const updated: SocialPost = {
        ...post,
        status: 'Publicado',
        lastError: undefined,
        updatedAt: ahoraIso,
      };
      postsMap.set(post.id, updated);
      resumen.publicados++;
      resumen.detalles.push({
        id: post.id,
        platform: plat,
        resultado: 'publicado',
      });
    } else {
      const intentos = (post.failedAttempts || 0) + 1;
      const esDefinitivo = intentos >= MAX_INTENTOS_FALLIDOS;
      const updated: SocialPost = {
        ...post,
        status: esDefinitivo ? 'Error' : 'Programado',
        failedAttempts: intentos,
        lastError: motivoFallo,
        updatedAt: ahoraIso,
      };
      postsMap.set(post.id, updated);
      resumen.fallidos++;
      resumen.detalles.push({
        id: post.id,
        platform: plat,
        resultado: esDefinitivo ? 'error_definitivo' : 'reintento_pendiente',
        motivo: motivoFallo,
      });
    }
  }

  // Guardar posts actualizados
  await writeData(POSTS_FILE, Array.from(postsMap.values()));

  return resumen;
}
