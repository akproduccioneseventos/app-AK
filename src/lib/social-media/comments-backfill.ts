import 'server-only';

import type { SocialConnection } from '@/types/settings';
import type {
  SocialComment,
  CommentNetwork,
  NetworkCommentsBackfillState,
  CommentsSyncSummary,
} from '@/types/comentarios-redes';
import { readData, writeData } from '@/lib/data-service';
import { clasificarComentario } from './clasificador-comentarios';

const COMMENTS_FILE = 'social-comments.json';
const CONNECTIONS_FILE = 'social-connections.json';
const STATE_FILE = 'social-comments-backfill-state.json';

const DEFAULT_EARLIEST_DATE = '2019-09-01T00:00:00.000Z';

/**
 * Cuantos comentarios se mandan a la inteligencia artificial en una sola
 * corrida.
 *
 * Cada revision cuesta plata y se descuenta del tope mensual del dueno. Sin este
 * limite, un solo toque en "Historial completo" —que trae anos de comentarios de
 * una— podia gastarle el presupuesto entero del mes de una sentada, sin avisarle
 * nada. Los que sobran quedan guardados sin revisar y los toma la corrida
 * siguiente, empezando por los mas nuevos.
 */
const MAX_REVISIONES_POR_CORRIDA = 100;

function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION
    || process.env.INSTAGRAM_GRAPH_API_VERSION
    || 'v19.0';
}

/**
 * Obtiene todos los comentarios guardados en la base de datos local.
 */
export async function getStoredComments(): Promise<SocialComment[]> {
  const comments = await readData<SocialComment[]>(COMMENTS_FILE, []);
  return comments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Obtiene el estado del proceso de sincronización por red social.
 */
export async function getCommentsBackfillState(): Promise<Record<CommentNetwork, NetworkCommentsBackfillState>> {
  const defaultState: Record<CommentNetwork, NetworkCommentsBackfillState> = {
    Facebook: { fetchedCount: 0, newCommentsCount: 0, exhausted: false },
    Instagram: { fetchedCount: 0, newCommentsCount: 0, exhausted: false },
    YouTube: { fetchedCount: 0, newCommentsCount: 0, exhausted: false },
  };
  return readData<Record<CommentNetwork, NetworkCommentsBackfillState>>(STATE_FILE, defaultState);
}

/**
 * Oculta un comentario en Meta Graph API (Facebook / Instagram).
 */
async function hideCommentOnMeta(commentId: string, accessToken: string): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/${graphVersion()}/${commentId}?is_hidden=true&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Desoculta un comentario en Meta Graph API (Facebook / Instagram).
 */
async function unhideCommentOnMeta(commentId: string, accessToken: string): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/${graphVersion()}/${commentId}?is_hidden=false&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sincroniza comentarios de Facebook Fanpage.
 */
async function syncFacebookComments(
  conn: SocialConnection,
  currentState: NetworkCommentsBackfillState,
  full: boolean
): Promise<{ comments: SocialComment[]; state: NetworkCommentsBackfillState }> {
  const state: NetworkCommentsBackfillState = {
    ...currentState,
    accountId: conn.pageId,
    lastAttemptAt: new Date().toISOString(),
    error: undefined,
  };

  if (!conn.isConnected || !conn.pageId || !conn.pageAccessToken) {
    state.error = 'Cuenta de Facebook no conectada o sin token en Ajustes.';
    return { comments: [], state };
  }

  const newComments: SocialComment[] = [];
  let nextUrl: string | null = full
    ? `https://graph.facebook.com/${graphVersion()}/${conn.pageId}/feed?fields=id,message,created_time,permalink_url,comments{id,message,created_time,from,permalink_url}&limit=50&access_token=${encodeURIComponent(conn.pageAccessToken)}`
    : `https://graph.facebook.com/${graphVersion()}/${conn.pageId}/feed?fields=id,message,created_time,permalink_url,comments{id,message,created_time,from,permalink_url}&limit=10&access_token=${encodeURIComponent(conn.pageAccessToken)}`;

  let pagesFetched = 0;
  const maxPages = full ? 20 : 2;

  try {
    while (nextUrl && pagesFetched < maxPages) {
      pagesFetched++;
      const res: Response = await fetch(nextUrl);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        state.error = err.error?.message || `HTTP ${res.status} al consultar Facebook`;
        break;
      }

      const json: any = await res.json();
      const posts = json.data || [];

      for (const post of posts) {
        const postComments = post.comments?.data || [];
        for (const c of postComments) {
          if (!c.id || !c.message) continue;
          newComments.push({
            id: `fb_${c.id}`,
            network: 'Facebook',
            networkCommentId: c.id,
            postId: post.id || '',
            postTitle: post.message ? post.message.slice(0, 60) : 'Publicación de Facebook',
            postUrl: post.permalink_url,
            authorName: c.from?.name || 'Usuario de Facebook',
            authorId: c.from?.id,
            text: c.message.trim(),
            createdAt: c.created_time || new Date().toISOString(),
            permalink: c.permalink_url || post.permalink_url,
          });
        }
      }

      nextUrl = json.paging?.next || null;
    }

    state.lastSyncAt = new Date().toISOString();
    state.fetchedCount = (state.fetchedCount || 0) + newComments.length;
    state.exhausted = !nextUrl;
  } catch (err: any) {
    state.error = err.message || 'Error de red con Facebook.';
  }

  return { comments: newComments, state };
}

/**
 * Sincroniza comentarios de Instagram Business.
 */
async function syncInstagramComments(
  conn: SocialConnection,
  currentState: NetworkCommentsBackfillState,
  full: boolean
): Promise<{ comments: SocialComment[]; state: NetworkCommentsBackfillState }> {
  const state: NetworkCommentsBackfillState = {
    ...currentState,
    accountId: conn.instagramAccountId,
    lastAttemptAt: new Date().toISOString(),
    error: undefined,
  };

  const igAccountId = conn.instagramAccountId || conn.pageId;
  if (!conn.isConnected || !igAccountId || !conn.pageAccessToken) {
    state.error = 'Cuenta de Instagram no conectada o sin token en Ajustes.';
    return { comments: [], state };
  }

  const newComments: SocialComment[] = [];
  let nextUrl: string | null = full
    ? `https://graph.facebook.com/${graphVersion()}/${igAccountId}/media?fields=id,caption,timestamp,permalink,comments{id,text,timestamp,username,permalink}&limit=50&access_token=${encodeURIComponent(conn.pageAccessToken)}`
    : `https://graph.facebook.com/${graphVersion()}/${igAccountId}/media?fields=id,caption,timestamp,permalink,comments{id,text,timestamp,username,permalink}&limit=10&access_token=${encodeURIComponent(conn.pageAccessToken)}`;

  let pagesFetched = 0;
  const maxPages = full ? 20 : 2;

  try {
    while (nextUrl && pagesFetched < maxPages) {
      pagesFetched++;
      const res: Response = await fetch(nextUrl);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        state.error = err.error?.message || `HTTP ${res.status} al consultar Instagram`;
        break;
      }

      const json: any = await res.json();
      const mediaList = json.data || [];

      for (const media of mediaList) {
        const mediaComments = media.comments?.data || [];
        for (const c of mediaComments) {
          if (!c.id || !c.text) continue;
          newComments.push({
            id: `ig_${c.id}`,
            network: 'Instagram',
            networkCommentId: c.id,
            postId: media.id || '',
            postTitle: media.caption ? media.caption.slice(0, 60) : 'Foto/Video de Instagram',
            postUrl: media.permalink,
            authorName: c.username ? `@${c.username}` : 'Usuario de Instagram',
            text: c.text.trim(),
            createdAt: c.timestamp || new Date().toISOString(),
            permalink: c.permalink || media.permalink,
          });
        }
      }

      nextUrl = json.paging?.next || null;
    }

    state.lastSyncAt = new Date().toISOString();
    state.fetchedCount = (state.fetchedCount || 0) + newComments.length;
    state.exhausted = !nextUrl;
  } catch (err: any) {
    state.error = err.message || 'Error de red con Instagram.';
  }

  return { comments: newComments, state };
}

/**
 * Sincroniza comentarios de YouTube si la clave de API y canal están presentes.
 */
async function syncYouTubeComments(
  currentState: NetworkCommentsBackfillState,
  full: boolean
): Promise<{ comments: SocialComment[]; state: NetworkCommentsBackfillState }> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UClq6YnypA9PFuBgunzk306A';

  const state: NetworkCommentsBackfillState = {
    ...currentState,
    accountId: channelId,
    lastAttemptAt: new Date().toISOString(),
    error: undefined,
  };

  if (!apiKey) {
    state.error = 'Falta YOUTUBE_API_KEY en variables de entorno del servidor.';
    return { comments: [], state };
  }

  const newComments: SocialComment[] = [];
  const maxResults = full ? 50 : 15;
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&maxResults=${maxResults}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      state.error = err.error?.message || `HTTP ${res.status} al consultar YouTube`;
      return { comments: [], state };
    }

    const json = await res.json();
    const items = json.items || [];

    for (const item of items) {
      const top = item.snippet?.topLevelComment?.snippet;
      if (!top || !top.textDisplay) continue;

      const commentId = item.id;
      const videoId = item.snippet?.videoId || '';

      newComments.push({
        id: `yt_${commentId}`,
        network: 'YouTube',
        networkCommentId: commentId,
        postId: videoId,
        postTitle: 'Video de YouTube',
        postUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
        authorName: top.authorDisplayName || 'Usuario de YouTube',
        authorProfileUrl: top.authorChannelUrl,
        text: top.textDisplay.replace(/<[^>]*>?/gm, '').trim(),
        createdAt: top.publishedAt || new Date().toISOString(),
        permalink: videoId ? `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}` : undefined,
      });
    }

    state.lastSyncAt = new Date().toISOString();
    state.fetchedCount = (state.fetchedCount || 0) + newComments.length;
    state.exhausted = !json.nextPageToken;
  } catch (err: any) {
    state.error = err.message || 'Error de red con YouTube.';
  }

  return { comments: newComments, state };
}

/**
 * Función central para sincronizar comentarios de todas las redes configuradas.
 * - Modo full: barrido histórico completo.
 * - Modo incremental: sólo lo nuevo.
 */
export async function syncCommentsFromNetworks(options?: { full?: boolean }): Promise<CommentsSyncSummary> {
  const isFull = Boolean(options?.full);
  const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);
  const fbConn = connections.find((c) => c.platform === 'Facebook') || { platform: 'Facebook', isConnected: false };
  const igConn = connections.find((c) => c.platform === 'Instagram') || { platform: 'Instagram', isConnected: false };

  const currentStates = await getCommentsBackfillState();
  const existingComments = await readData<SocialComment[]>(COMMENTS_FILE, []);
  const existingMap = new Map(existingComments.map((c) => [c.id, c]));

  // 1. Ejecutar sync por red (sin que el fallo de una rompa las demás)
  const [fbResult, igResult, ytResult] = await Promise.all([
    syncFacebookComments(fbConn, currentStates.Facebook, isFull),
    syncInstagramComments(igConn, currentStates.Instagram, isFull),
    syncYouTubeComments(currentStates.YouTube, isFull),
  ]);

  const allIncoming = [
    ...fbResult.comments,
    ...igResult.comments,
    ...ytResult.comments,
  ];

  let totalNew = 0;
  let totalAutoHidden = 0;

  // 2. Guardar los comentarios nuevos. Se guardan siempre, aunque despues no
  //    alcance el presupuesto para revisarlos: perder el comentario es peor.
  for (const inc of allIncoming) {
    if (!existingMap.has(inc.id)) {
      totalNew++;
      existingMap.set(inc.id, inc);
    }
  }

  // 3. Revisar con inteligencia artificial, hasta el tope de la corrida.
  //    Entran tambien los que quedaron sin revisar de corridas anteriores, del
  //    mas nuevo al mas viejo: lo de ayer importa mas que lo de 2019.
  const sinRevisar = Array.from(existingMap.values())
    .filter((c) => !c.classifiedAt && !c.isDeleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let totalClasificados = 0;
  let fallosSeguidos = 0;
  for (const inc of sinRevisar.slice(0, MAX_REVISIONES_POR_CORRIDA)) {
    const clasif = await clasificarComentario(inc.text, inc.authorName);

    if (!clasif.classified) {
      // Sin presupuesto, o la inteligencia artificial no responde. Se corta la
      // corrida en vez de seguir golpeando: los que faltan quedan guardados sin
      // revisar y los toma la corrida siguiente.
      fallosSeguidos++;
      if (fallosSeguidos >= 3) break;
      continue;
    }

    fallosSeguidos = 0;
    totalClasificados++;
    inc.sentiment = clasif.sentiment;
    inc.sentimentReason = clasif.sentimentReason;
    inc.isInsultOrSpam = clasif.isInsultOrSpam;
    inc.isLegitimateComplaint = clasif.isLegitimateComplaint;
    inc.classifiedAt = new Date().toISOString();

    // Si es insulto o spam flagrante, ocultamiento automático reversible
    if (clasif.autoHideRecommended) {
      inc.isAutoHidden = true;
      inc.autoHiddenReason = clasif.sentimentReason || 'Ocultado automáticamente por insulto o spam';
      inc.autoHiddenAt = new Date().toISOString();
      totalAutoHidden++;

      // Ejecutar ocultamiento en Meta si es de Facebook / Instagram
      if (inc.network === 'Facebook' && fbConn.pageAccessToken) {
        await hideCommentOnMeta(inc.networkCommentId, fbConn.pageAccessToken);
      } else if (inc.network === 'Instagram' && igConn.pageAccessToken) {
        await hideCommentOnMeta(inc.networkCommentId, igConn.pageAccessToken);
      }
    }
  }

  const pendientesDeClasificar = Math.max(0, sinRevisar.length - totalClasificados);

  const updatedComments = Array.from(existingMap.values());
  await writeData(COMMENTS_FILE, updatedComments);

  const newStates: Record<CommentNetwork, NetworkCommentsBackfillState> = {
    Facebook: { ...fbResult.state, newCommentsCount: fbResult.comments.length },
    Instagram: { ...igResult.state, newCommentsCount: igResult.comments.length },
    YouTube: { ...ytResult.state, newCommentsCount: ytResult.comments.length },
  };

  await writeData(STATE_FILE, newStates);

  return {
    success: true,
    totalFetched: allIncoming.length,
    totalNew,
    totalAutoHidden,
    totalClasificados,
    pendientesDeClasificar,
    platforms: newStates,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Desoculta un comentario manualmente en la red y en la base local (1 solo toque).
 */
export async function restoreHiddenCommentInternal(commentId: string): Promise<{ success: boolean; error?: string }> {
  const comments = await readData<SocialComment[]>(COMMENTS_FILE, []);
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx === -1) {
    return { success: false, error: 'Comentario no encontrado.' };
  }

  const target = comments[idx];
  const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);

  if (target.network === 'Facebook') {
    const conn = connections.find((c) => c.platform === 'Facebook');
    if (conn?.pageAccessToken) {
      await unhideCommentOnMeta(target.networkCommentId, conn.pageAccessToken);
    }
  } else if (target.network === 'Instagram') {
    const conn = connections.find((c) => c.platform === 'Instagram');
    if (conn?.pageAccessToken) {
      await unhideCommentOnMeta(target.networkCommentId, conn.pageAccessToken);
    }
  }

  target.isAutoHidden = false;
  target.isManuallyRestored = true;
  target.manuallyRestoredAt = new Date().toISOString();

  await writeData(COMMENTS_FILE, comments);
  return { success: true };
}

/**
 * Oculta un comentario manualmente en la red y en la base local.
 */
export async function hideCommentInternal(commentId: string): Promise<{ success: boolean; error?: string }> {
  const comments = await readData<SocialComment[]>(COMMENTS_FILE, []);
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx === -1) {
    return { success: false, error: 'Comentario no encontrado.' };
  }

  const target = comments[idx];
  const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);

  if (target.network === 'Facebook') {
    const conn = connections.find((c) => c.platform === 'Facebook');
    if (conn?.pageAccessToken) {
      await hideCommentOnMeta(target.networkCommentId, conn.pageAccessToken);
    }
  } else if (target.network === 'Instagram') {
    const conn = connections.find((c) => c.platform === 'Instagram');
    if (conn?.pageAccessToken) {
      await hideCommentOnMeta(target.networkCommentId, conn.pageAccessToken);
    }
  }

  target.isAutoHidden = true;
  target.autoHiddenReason = 'Ocultado manualmente por el dueño';
  target.autoHiddenAt = new Date().toISOString();

  await writeData(COMMENTS_FILE, comments);
  return { success: true };
}
