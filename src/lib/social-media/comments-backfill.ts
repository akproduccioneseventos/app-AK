import 'server-only';

import { createHash } from 'crypto';
import type { SocialConnection } from '@/types/settings';
import type {
  SocialComment,
  CommentNetwork,
  NetworkCommentsBackfillState,
  CommentsSyncSummary,
} from '@/types/comentarios-redes';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';
import { readData, writeData } from '@/lib/data-service';
import { mutarComentarios, aplicarParches, parcheEntre } from '@/lib/social-media/guardar-comentarios';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { enlaceAlSimuladorDelProspecto } from '@/lib/whatsapp/datos-prospecto';
import {
  getGoogleBusinessReviews,
  replyToGoogleBusinessReview,
  generarBorradorRespuesta,
} from '@/lib/social-media/google-business-resenas';
import {
  clasificarComentario,
  armarAgradecimientoComentario,
  sanitizarTextoRespuesta,
  alertarDuenioPorComentarioNegativo,
  type ClasificacionComentarioResult,
} from './clasificador-comentarios';

export {
  armarAgradecimientoComentario,
  sanitizarTextoRespuesta,
  alertarDuenioPorComentarioNegativo,
};
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';

const COMMENTS_FILE = 'social-comments.json';
const CONNECTIONS_FILE = 'social-connections.json';
const STATE_FILE = 'social-comments-backfill-state.json';
const AJUSTES_RESPUESTAS_FILE = 'marketing-respuestas-comentarios.json';

export const PALABRAS_CLAVE_POR_DEFECTO = ['FECHA', 'PRECIO', 'INFO', 'PRESUPUESTO'] as const;
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export interface AjustesRespuestasComentarios {
  activo?: boolean;
  comentarios?: boolean;
  mensajesDirectos?: boolean;
  meGusta?: boolean;
  ocultar?: boolean;
  palabrasClaveActivo?: boolean;
  palabrasClave?: string[];
  agradecerMenciones?: boolean;
  compartirSoloHistorias?: boolean;
  porRed?: Partial<Record<CommentNetwork, { comentarios?: boolean; meGusta?: boolean; ocultar?: boolean }>>;
  actualizadoAt?: string;
}

export async function getAjustesRespuestasComentarios(): Promise<AjustesRespuestasComentarios> {
  const guardados = await readData<AjustesRespuestasComentarios>(AJUSTES_RESPUESTAS_FILE, {
    activo: true,
    comentarios: true,
    mensajesDirectos: true,
    meGusta: true,
    ocultar: true,
    palabrasClaveActivo: true,
    palabrasClave: [...PALABRAS_CLAVE_POR_DEFECTO],
    agradecerMenciones: true,
    compartirSoloHistorias: false,
  });
  const comentarios = guardados?.comentarios !== undefined
    ? guardados.comentarios
    : (guardados?.activo !== undefined ? guardados.activo : true);
  const mensajesDirectos = guardados?.mensajesDirectos !== undefined ? guardados.mensajesDirectos : true;
  const meGusta = guardados?.meGusta !== undefined ? guardados.meGusta : true;
  const ocultar = guardados?.ocultar !== undefined ? guardados.ocultar : true;
  const palabrasClaveActivo = guardados?.palabrasClaveActivo !== undefined ? guardados.palabrasClaveActivo : true;
  const palabrasClave = Array.isArray(guardados?.palabrasClave) && guardados.palabrasClave.length > 0
    ? guardados.palabrasClave
    : [...PALABRAS_CLAVE_POR_DEFECTO];
  const agradecerMenciones = guardados?.agradecerMenciones !== undefined ? guardados.agradecerMenciones : true;
  const compartirSoloHistorias = guardados?.compartirSoloHistorias !== undefined ? guardados.compartirSoloHistorias : false;
  return {
    ...guardados,
    activo: comentarios,
    comentarios,
    mensajesDirectos,
    meGusta,
    ocultar,
    palabrasClaveActivo,
    palabrasClave,
    agradecerMenciones,
    compartirSoloHistorias,
  };
}

export async function setAjustesRespuestasComentarios(
  opciones: boolean | Partial<AjustesRespuestasComentarios>
): Promise<AjustesRespuestasComentarios> {
  const actuales = await getAjustesRespuestasComentarios();
  let nuevosValores: Partial<AjustesRespuestasComentarios> = {};
  if (typeof opciones === 'boolean') {
    nuevosValores = { activo: opciones, comentarios: opciones };
  } else {
    nuevosValores = opciones;
  }
  const comentarios = nuevosValores.comentarios !== undefined ? nuevosValores.comentarios : actuales.comentarios;
  const mensajesDirectos = nuevosValores.mensajesDirectos !== undefined ? nuevosValores.mensajesDirectos : actuales.mensajesDirectos;
  const meGusta = nuevosValores.meGusta !== undefined ? nuevosValores.meGusta : actuales.meGusta;
  const ocultar = nuevosValores.ocultar !== undefined ? nuevosValores.ocultar : actuales.ocultar;
  const palabrasClaveActivo = nuevosValores.palabrasClaveActivo !== undefined ? nuevosValores.palabrasClaveActivo : actuales.palabrasClaveActivo;
  const palabrasClave = nuevosValores.palabrasClave !== undefined ? nuevosValores.palabrasClave : actuales.palabrasClave;
  const agradecerMenciones = nuevosValores.agradecerMenciones !== undefined ? nuevosValores.agradecerMenciones : actuales.agradecerMenciones;
  const compartirSoloHistorias = nuevosValores.compartirSoloHistorias !== undefined ? nuevosValores.compartirSoloHistorias : actuales.compartirSoloHistorias;

  const ajustes: AjustesRespuestasComentarios = {
    ...actuales,
    ...nuevosValores,
    activo: comentarios,
    comentarios,
    mensajesDirectos,
    meGusta,
    ocultar,
    palabrasClaveActivo,
    palabrasClave,
    agradecerMenciones,
    compartirSoloHistorias,
    actualizadoAt: new Date().toISOString(),
  };
  await writeData(AJUSTES_RESPUESTAS_FILE, ajustes);
  return ajustes;
}

function normalizarParaPalabraClave(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compara por palabra entera sin mayúsculas ni acentos.
 * Ej: "INFO" coincide con "info" e "información", pero NO con "informal".
 */
export function detectarPalabraClave(
  texto: string,
  palabrasClave: string[] = [...PALABRAS_CLAVE_POR_DEFECTO],
): string | null {
  const normTexto = normalizarParaPalabraClave(texto);
  if (!normTexto.trim()) return null;

  for (const kw of palabrasClave) {
    const clean = normalizarParaPalabraClave(kw).trim();
    if (!clean) continue;
    const variantes = [escapeRegExp(clean)];
    if (clean === 'info') {
      variantes.push('informacion');
    } else if (clean === 'fecha') {
      variantes.push('fechas');
    } else if (clean === 'precio') {
      variantes.push('precios');
    } else if (clean === 'presupuesto') {
      variantes.push('presupuestos');
    }
    const regex = new RegExp(`(?:^|[^a-z0-9_])(?:${variantes.join('|')})(?:$|[^a-z0-9_])`, 'i');
    if (regex.test(normTexto)) {
      return kw.toUpperCase();
    }
  }
  return null;
}

function generarRefComentario(seed: string): string {
  const hash = createHash('sha256').update(seed || 'ak').digest('hex').slice(0, 6).toUpperCase();
  return `AK-${hash}`;
}

export function armarMensajePrivadoPalabraClave(comentario: SocialComment): string {
  const nombreRaw = (comentario.authorName || '').replace(/^@/, '').trim();
  const nombreSaludo = nombreRaw && nombreRaw !== 'Anónimo' ? nombreRaw.split(/\s+/)[0] : 'Hola';
  const source = comentario.network === 'Instagram' ? 'instagram' : 'facebook';
  const refCode = generarRefComentario(`${source}_comentario:${comentario.authorId || comentario.authorName || comentario.id}`);
  const baseSimulador = enlaceAlSimuladorDelProspecto({ entry: `${source}_comentario` });
  const sep = baseSimulador.includes('?') ? '&' : '?';
  const simulatorUrl = `${baseSimulador}${sep}utm_source=${source}&utm_medium=comentario&ref=${encodeURIComponent(refCode)}`;
  return sanitizarTextoRespuesta(
    `¡Hola ${nombreSaludo}! Soy el asistente virtual de AK Producciones 👋 Te comparto nuestro simulador para que armes tu propuesta al instante: ${simulatorUrl} (ref ${refCode})`,
  );
}

export function limpiarNumerosDePrecio(texto: string): string {
  return texto.replace(/\$?\s*\d+([.,]\d+)?\s*(usd|dólares|pesos|uyu)?/gi, '').trim();
}

export async function armarRespuestaAPregunta(
  comentarioTexto: string,
  autor: string,
): Promise<string | null> {
  const tienePresupuesto = await hayPresupuestoParaIA();
  if (!tienePresupuesto) return null;

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '¡Hola! Para consultar disponibilidad y ver presupuestos a medida, escribinos directamente por WhatsApp y te asesoramos.';
  }

  try {
    const prompt = `Un usuario (${autor || 'Cliente'}) dejó este comentario en las redes de AK Producciones:
"${comentarioTexto}"

Generá una respuesta corta (máximo 2 oraciones), amable y cercana en español rioplatense (uruguayo).
REGLAS ESTRICTAS:
1. NO des ningún precio ni menciones números de dinero bajo ningún concepto.
2. NO confirmes disponibilidad de fechas.
3. Invitá siempre a escribir por WhatsApp para coordinar y asesorarlo en detalle.
4. NUNCA uses la palabra "garantía" ni "garantizar".
5. NUNCA menciones atención o servicio "24/7" ni "24 horas".
6. NO nombres personal ni menciones agasajados o clientes específicos.`;

    // Con respaldos de modelo (antes: fetch directo a gemini-1.5-flash, ya retirado). Si la IA falla
    // se mantiene el mismo texto neutro de siempre: nunca se publica algo inventado.
    const respuesta = await generateWithGeminiFallback({ prompt });
    const textoIA = (respuesta.text || '').trim();
    if (!textoIA) {
      return '¡Hola! Para consultar disponibilidad y ver presupuestos a medida, escribinos al WhatsApp de AK Producciones y te pasamos toda la info.';
    }

    await registrarConsumoIA('clasificacion-comentarios');
    return sanitizarTextoRespuesta(textoIA);
  } catch {
    return '¡Hola! Para consultar disponibilidad y coordinar, escribinos por WhatsApp.';
  }
}

export async function postReplyToMetaComment(
  commentId: string,
  network: CommentNetwork,
  message: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const endpoint =
      network === 'Instagram'
        ? `https://graph.facebook.com/${graphVersion()}/${commentId}/replies`
        : `https://graph.facebook.com/${graphVersion()}/${commentId}/comments`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Da me gusta a un comentario en Facebook (`POST /{comment-id}/likes`).
 * Instagram no permite dar me gusta a comentarios desde otra aplicación.
 */
export async function darMeGustaComentarioFacebook(
  commentId: string,
  accessToken: string,
): Promise<boolean> {
  if (!commentId || !accessToken) return false;
  try {
    const endpoint = `https://graph.facebook.com/${graphVersion()}/${commentId}/likes`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Envía mensaje privado en Meta usando respuesta privada al comentario (`recipient: { comment_id }`).
 */
export async function sendPrivateReplyToMetaComment(params: {
  pageId: string;
  commentId: string;
  message: string;
  accessToken: string;
}): Promise<boolean> {
  const { pageId, commentId, message, accessToken } = params;
  if (!pageId || !commentId || !message || !accessToken) return false;
  try {
    const endpoint = `https://graph.facebook.com/${graphVersion()}/${pageId}/messages`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
        access_token: accessToken,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function postReplyToYouTubeComment(
  commentId: string,
  message: string,
  accessToken: string,
): Promise<boolean> {
  if (!commentId || !message || !accessToken) return false;
  try {
    const res = await fetch('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          parentId: commentId,
          textOriginal: message,
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function postReplyToThreadsComment(
  commentId: string,
  threadsUserId: string,
  message: string,
  accessToken: string,
): Promise<boolean> {
  if (!commentId || !threadsUserId || !message || !accessToken) return false;
  try {
    const createParams = new URLSearchParams({
      media_type: 'TEXT',
      text: message.slice(0, 500),
      reply_to_id: commentId,
      access_token: accessToken,
    });
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads?${createParams.toString()}`,
      { method: 'POST' },
    );
    if (!containerRes.ok) return false;
    const containerJson = await containerRes.json().catch(() => ({}));
    if (!containerJson?.id) return false;

    const pubParams = new URLSearchParams({
      creation_id: containerJson.id,
      access_token: accessToken,
    });
    const pubRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish?${pubParams.toString()}`,
      { method: 'POST' },
    );
    return pubRes.ok;
  } catch {
    return false;
  }
}

/**
 * Responde automáticamente a un comentario si aplica:
 * - Preguntas reciben respuesta comercial sin precios invitando a WhatsApp.
 * - Comentarios positivos o neutros reciben agradecimiento cordial con la voz de AK.
 * - Quejas, negativos, insultos o spam NUNCA se contestan solos.
 */
export async function responderComentarioSiAplica(
  comentario: SocialComment,
  connections?: SocialConnection[],
): Promise<boolean> {
  if (comentario.respuestaAutomatica) return false;
  if (comentario.isInsultOrSpam || comentario.isAutoHidden) return false;
  if (comentario.isLegitimateComplaint || comentario.sentiment === 'negativo') return false;
  if (comentario.network === 'Pinterest' || comentario.network === 'X' || comentario.network === 'TikTok') return false;

  const ajustes = await getAjustesRespuestasComentarios();
  if (!ajustes.activo) return false;
  if (ajustes.porRed?.[comentario.network]?.comentarios === false) return false;

  const presupuestoOk = await hayPresupuestoParaIA();
  if (!presupuestoOk) return false;

  const conns = connections || (await readData<SocialConnection[]>(CONNECTIONS_FILE, []));
  let token: string | undefined;
  let threadsUserId: string | undefined;

  if (comentario.network === 'Facebook') {
    const conn = conns.find((c) => c.platform === 'Facebook');
    token = conn?.pageAccessToken || conn?.accessToken;
  } else if (comentario.network === 'Instagram') {
    const conn = conns.find((c) => c.platform === 'Instagram');
    token = conn?.pageAccessToken || conn?.accessToken;
  } else if (comentario.network === 'YouTube') {
    const conn = conns.find((c) => c.platform === 'YouTube');
    token = conn?.accessToken;
  } else if (comentario.network === 'Threads') {
    const conn = conns.find((c) => c.platform === 'Threads');
    token = conn?.accessToken || conn?.pageAccessToken;
    threadsUserId = conn?.pageId;
  }

  if (!token) return false;

  let respuestaTexto: string | null = null;
  if (comentario.esPregunta) {
    respuestaTexto = await armarRespuestaAPregunta(comentario.text, comentario.authorName);
  } else if (comentario.sentiment === 'positivo' || comentario.sentiment === 'neutro') {
    respuestaTexto = await armarAgradecimientoComentario(comentario.text, comentario.authorName);
  }

  if (!respuestaTexto) return false;
  respuestaTexto = sanitizarTextoRespuesta(respuestaTexto);

  let publicadoOk = false;
  if (comentario.network === 'Facebook' || comentario.network === 'Instagram') {
    publicadoOk = await postReplyToMetaComment(
      comentario.networkCommentId,
      comentario.network,
      respuestaTexto,
      token,
    );
  } else if (comentario.network === 'YouTube') {
    publicadoOk = await postReplyToYouTubeComment(
      comentario.networkCommentId,
      respuestaTexto,
      token,
    );
  } else if (comentario.network === 'Threads' && threadsUserId) {
    publicadoOk = await postReplyToThreadsComment(
      comentario.networkCommentId,
      threadsUserId,
      respuestaTexto,
      token,
    );
  }

  if (publicadoOk) {
    const nowIso = new Date().toISOString();
    comentario.respuestaAutomatica = {
      texto: respuestaTexto,
      at: nowIso,
    };
    comentario.respondidoAt = nowIso;
    return true;
  }

  return false;
}

export async function responderPreguntaComentarioSiAplica(
  comentario: SocialComment,
  connections?: SocialConnection[],
): Promise<boolean> {
  if (!comentario.esPregunta) return false;
  return responderComentarioSiAplica(comentario, connections);
}

/**
 * Pasada diaria / barrido: todo comentario sin responder de más de 24h
 * que no sea queja/spam/negativo recibe respuesta automática.
 */
export async function ejecutarPasadaDiariaComentarios(
  ahora: Date = new Date(),
  connections?: SocialConnection[],
): Promise<{ respondidos: number; omitidos: number }> {
  const comments = await readData<SocialComment[]>(COMMENTS_FILE, []);
  const conns = connections || (await readData<SocialConnection[]>(CONNECTIONS_FILE, []));
  const ahoraMs = ahora.getTime();
  const unDiaMs = 24 * 60 * 60 * 1000;

  let respondidos = 0;
  let omitidos = 0;

  const sinResponder = comments.filter((c) => {
    if (c.respuestaAutomatica) return false;
    if (c.isDeleted || c.isAutoHidden) return false;
    if (c.isInsultOrSpam || c.isLegitimateComplaint || c.sentiment === 'negativo') return false;
    const creadoMs = new Date(c.createdAt).getTime();
    if (Number.isNaN(creadoMs)) return false;
    return ahoraMs - creadoMs >= unDiaMs;
  });

  for (const c of sinResponder) {
    const ok = await responderComentarioSiAplica(c, conns);
    if (ok) {
      respondidos++;
    } else {
      omitidos++;
    }
  }

  if (respondidos > 0) {
    await mutarComentarios((lista) => {
      const mapa = new Map(sinResponder.filter((c) => c.respuestaAutomatica).map((c) => [c.id, c]));
      return lista.map((item) => mapa.get(item.id) || item);
    });
  }

  return { respondidos, omitidos };
}

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
    Google: { fetchedCount: 0, newCommentsCount: 0, exhausted: false },
    Threads: { fetchedCount: 0, newCommentsCount: 0, exhausted: false },
    TikTok: { fetchedCount: 0, newCommentsCount: 0, exhausted: true, error: 'Esta red no deja contestar desde otra aplicación' },
    Pinterest: { fetchedCount: 0, newCommentsCount: 0, exhausted: true, error: 'Esta red no deja contestar desde otra aplicación' },
    X: { fetchedCount: 0, newCommentsCount: 0, exhausted: true, error: 'Esta red no deja contestar desde otra aplicación' },
  };
  const guardados = await readData<Partial<Record<CommentNetwork, NetworkCommentsBackfillState>>>(STATE_FILE, defaultState);
  return { ...defaultState, ...(guardados || {}) };
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
    ? `https://graph.facebook.com/${graphVersion()}/${conn.pageId}/feed?fields=id,message,full_picture,created_time,permalink_url,comments{id,message,created_time,from,permalink_url}&limit=50&access_token=${encodeURIComponent(conn.pageAccessToken)}`
    : `https://graph.facebook.com/${graphVersion()}/${conn.pageId}/feed?fields=id,message,full_picture,created_time,permalink_url,comments{id,message,created_time,from,permalink_url}&limit=10&access_token=${encodeURIComponent(conn.pageAccessToken)}`;

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
            postMediaUrl: post.full_picture,
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
    ? `https://graph.facebook.com/${graphVersion()}/${igAccountId}/media?fields=id,caption,media_url,thumbnail_url,timestamp,permalink,comments{id,text,timestamp,username,permalink}&limit=50&access_token=${encodeURIComponent(conn.pageAccessToken)}`
    : `https://graph.facebook.com/${graphVersion()}/${igAccountId}/media?fields=id,caption,media_url,thumbnail_url,timestamp,permalink,comments{id,text,timestamp,username,permalink}&limit=10&access_token=${encodeURIComponent(conn.pageAccessToken)}`;

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
            postMediaUrl: media.thumbnail_url || media.media_url,
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
  conn: SocialConnection | undefined,
  currentState: NetworkCommentsBackfillState,
  full: boolean
): Promise<{ comments: SocialComment[]; state: NetworkCommentsBackfillState }> {
  const apiKey = conn?.apiKey || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  const channelId = conn?.channelId || process.env.YOUTUBE_CHANNEL_ID || 'UClq6YnypA9PFuBgunzk306A';

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

function parseGoogleStarRating(rating: unknown): number {
  if (typeof rating === 'number' && Number.isFinite(rating)) return rating;
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  const key = String(rating || '').toUpperCase();
  return map[key] || Number(rating) || 5;
}

async function resolveGoogleBusinessCredentials(
  connections: SocialConnection[],
): Promise<{ accessToken?: string; accountLocationId?: string }> {
  const googleConn = connections.find((c) => c.platform === 'Google' && c.isConnected);
  if (googleConn?.accessToken && googleConn?.locationId) {
    return { accessToken: googleConn.accessToken, accountLocationId: googleConn.locationId };
  }
  try {
    const accounts = await readData<GoogleWorkspaceAccount[]>('_google-workspace-accounts.json', []);
    const company = Array.isArray(accounts)
      ? accounts.find((a) => a.kind === 'company' && a.status === 'connected')
      : undefined;
    if (company?.accessToken) {
      return {
        accessToken: company.accessToken,
        accountLocationId: process.env.GOOGLE_BUSINESS_LOCATION_ID || 'accounts/me/locations/primary',
      };
    }
  } catch {
    // sin cuentas workspace
  }
  return {};
}

/**
 * Sincroniza reseñas de Google Business Profile.
 */
async function syncGoogleReviews(
  connections: SocialConnection[],
  currentState: NetworkCommentsBackfillState,
): Promise<{ comments: SocialComment[]; state: NetworkCommentsBackfillState }> {
  const creds = await resolveGoogleBusinessCredentials(connections);
  const state: NetworkCommentsBackfillState = {
    ...currentState,
    accountId: creds.accountLocationId,
    lastAttemptAt: new Date().toISOString(),
    error: undefined,
  };

  if (!creds.accessToken || !creds.accountLocationId) {
    state.error = 'Ficha de Google sin permisos o Location ID configurado en Ajustes.';
    return { comments: [], state };
  }

  const res = await getGoogleBusinessReviews({
    accessToken: creds.accessToken,
    accountLocationId: creds.accountLocationId,
  });

  if (!res.success) {
    state.error = res.errorCriollo || res.error || 'No se pudieron leer las reseñas de Google.';
    return { comments: [], state };
  }

  const mapped: SocialComment[] = res.reviews.map((r) => {
    const estrellas = parseGoogleStarRating(r.starRating);
    return {
      id: `google_${r.reviewId}`,
      network: 'Google',
      networkCommentId: r.reviewId,
      postId: 'google_business_profile',
      postTitle: `Reseña de Google (${estrellas}★)`,
      authorName: r.reviewer?.displayName || 'Cliente en Google',
      authorProfileUrl: r.reviewer?.profilePhotoUrl,
      text: (r.comment || '').trim() || `Calificación de ${estrellas} estrellas`,
      createdAt: r.createTime || new Date().toISOString(),
      starRating: estrellas,
      borradorRespuesta: r.borradorSugerido,
      ...(r.reviewReply?.comment
        ? {
            respuestaAutomatica: {
              texto: r.reviewReply.comment,
              at: r.reviewReply.updateTime || new Date().toISOString(),
            },
            respondidoAt: r.reviewReply.updateTime || new Date().toISOString(),
          }
        : {}),
    };
  });

  state.lastSyncAt = new Date().toISOString();
  state.fetchedCount = (state.fetchedCount || 0) + mapped.length;
  state.exhausted = true;
  return { comments: mapped, state };
}

/**
 * Sincroniza respuestas de Threads (Meta).
 */
async function syncThreadsComments(
  conn: SocialConnection,
  currentState: NetworkCommentsBackfillState,
  full: boolean,
): Promise<{ comments: SocialComment[]; state: NetworkCommentsBackfillState }> {
  const state: NetworkCommentsBackfillState = {
    ...currentState,
    accountId: conn.pageId,
    lastAttemptAt: new Date().toISOString(),
    error: undefined,
  };

  const token = conn.accessToken || conn.pageAccessToken;
  if (!conn.isConnected || !conn.pageId || !token) {
    state.error = 'Cuenta de Threads no conectada en Ajustes.';
    return { comments: [], state };
  }

  const newComments: SocialComment[] = [];
  const limit = full ? 25 : 10;

  try {
    const threadsUrl = `https://graph.threads.net/v1.0/${conn.pageId}/threads?fields=id,text,timestamp,permalink&limit=${limit}&access_token=${encodeURIComponent(token)}`;
    const threadsRes = await fetch(threadsUrl);
    if (!threadsRes.ok) {
      const err = await threadsRes.json().catch(() => ({}));
      state.error = err.error?.message || `HTTP ${threadsRes.status} al consultar Threads`;
      return { comments: [], state };
    }

    const threadsJson: any = await threadsRes.json();
    const threads = threadsJson.data || [];

    for (const t of threads) {
      if (!t.id) continue;
      const repliesUrl = `https://graph.threads.net/v1.0/${t.id}/replies?fields=id,text,username,timestamp,permalink&access_token=${encodeURIComponent(token)}`;
      const repliesRes = await fetch(repliesUrl);
      if (!repliesRes.ok) continue;
      const repliesJson: any = await repliesRes.json().catch(() => ({}));
      for (const r of repliesJson.data || []) {
        if (!r.id || !r.text) continue;
        newComments.push({
          id: `th_${r.id}`,
          network: 'Threads',
          networkCommentId: r.id,
          postId: t.id,
          postTitle: t.text ? String(t.text).slice(0, 60) : 'Publicación en Threads',
          postUrl: t.permalink,
          authorName: r.username ? `@${r.username}` : 'Usuario de Threads',
          text: String(r.text).trim(),
          createdAt: r.timestamp || new Date().toISOString(),
          permalink: r.permalink || t.permalink,
        });
      }
    }

    state.lastSyncAt = new Date().toISOString();
    state.fetchedCount = (state.fetchedCount || 0) + newComments.length;
    state.exhausted = true;
  } catch (err: any) {
    state.error = err.message || 'Error de red con Threads.';
  }

  return { comments: newComments, state };
}

async function armarBorradorResenaNegativaIA(
  comentario: SocialComment,
): Promise<string> {
  const fallback = generarBorradorRespuesta({
    reviewerName: comentario.authorName,
    comment: comentario.text,
    starRating: comentario.starRating ?? 2,
  });

  const tienePresupuesto = await hayPresupuestoParaIA().catch(() => false);
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!tienePresupuesto || !apiKey) {
    return sanitizarTextoRespuesta(fallback);
  }

  try {
    const prompt = `Un cliente (${comentario.authorName}) dejó esta reseña de ${comentario.starRating || 2} estrellas en Google Business de AK Producciones:
"${comentario.text}"

Redactá un borrador de respuesta cordial, empática y profesional en español rioplatense para que el dueño la revise y la publique.
REGLAS:
1. NO incluyas precios ni números de dinero.
2. NO uses "garantía", "garantizar", "24/7" ni promesas de plazos.
3. Invitá a conversar en privado para entender qué pasó y resolverlo.`;

    const res = await generateWithGeminiFallback({ prompt });
    const texto = (res.text || '').trim();
    if (!texto) return sanitizarTextoRespuesta(fallback);
    await registrarConsumoIA('clasificacion-comentarios').catch((e) => console.warn('[comments-backfill] Paso secundario sin completar:', e));
    return sanitizarTextoRespuesta(texto);
  } catch {
    return sanitizarTextoRespuesta(fallback);
  }
}

/**
 * Procesa un comentario/reseña aplicando las reglas de las Órdenes 326 y 327:
 * 1. Quejas/insultos/spam: ocultar (sin me gusta, sin privado, sin respuesta pública) y avisar al dueño en quejas.
 * 2. Google reseñas: 4-5★ agradece sola con el nombre; 1-3★ NO contesta sola, prepara borrador y avisa al dueño.
 * 3. Palabras clave (FECHA, PRECIO, INFO, PRESUPUESTO) <= 7 días: privado por comment_id + "¡Te escribimos por privado! 💬" + me gusta en FB.
 * 4. Positivo/neutro/pregunta: me gusta en FB (si interruptor prendido) + respuesta automática.
 */
export async function procesarComentarioRedes(
  inc: SocialComment,
  options?: {
    connections?: SocialConnection[];
    ahora?: Date;
    clasificacionPrevia?: ClasificacionComentarioResult;
  },
): Promise<SocialComment> {
  const ahora = options?.ahora ?? new Date();
  const ahoraMs = ahora.getTime();
  const nowIso = ahora.toISOString();
  const conns = options?.connections || (await readData<SocialConnection[]>(CONNECTIONS_FILE, []));
  const ajustes = await getAjustesRespuestasComentarios();

  const fbConn = conns.find((c) => c.platform === 'Facebook');
  const igConn = conns.find((c) => c.platform === 'Instagram');

  // 0. Clasificación si todavía no está clasificado
  if (!inc.classifiedAt) {
    if (inc.network === 'Google' && typeof inc.starRating === 'number') {
      const positiva = inc.starRating >= 4;
      inc.sentiment = positiva ? 'positivo' : 'negativo';
      inc.sentimentReason = positiva
        ? `Reseña positiva de ${inc.starRating} estrellas en Google`
        : `Reseña baja de ${inc.starRating} estrellas en Google`;
      inc.isInsultOrSpam = false;
      inc.isLegitimateComplaint = !positiva;
      inc.esPregunta = false;
      inc.classifiedAt = nowIso;
    } else {
      const clasif = options?.clasificacionPrevia || (await clasificarComentario(inc.text, inc.authorName));
      if (!clasif.classified) {
        return inc;
      }
      inc.sentiment = clasif.sentiment;
      inc.sentimentReason = clasif.sentimentReason;
      inc.isInsultOrSpam = clasif.isInsultOrSpam;
      inc.isLegitimateComplaint = clasif.isLegitimateComplaint;
      inc.esPregunta = clasif.esPregunta;
      inc.autoHideRecommended = clasif.autoHideRecommended;
      inc.classifiedAt = nowIso;
    }
  }

  const esNegativoOQueja = Boolean(
    inc.isLegitimateComplaint ||
    inc.sentiment === 'negativo' ||
    (inc.network === 'Google' && typeof inc.starRating === 'number' && inc.starRating <= 3),
  );
  const esInsultoOSpam = Boolean(inc.isInsultOrSpam);

  // A. Reseñas de Google (no se pueden ocultar ni dar me gusta)
  if (inc.network === 'Google') {
    const estrellas = typeof inc.starRating === 'number' ? inc.starRating : (esNegativoOQueja ? 2 : 5);
    const creds = await resolveGoogleBusinessCredentials(conns);

    if (estrellas >= 4 && !esNegativoOQueja && !esInsultoOSpam) {
      if (!inc.respuestaAutomatica && ajustes.activo && ajustes.porRed?.Google?.comentarios !== false) {
        const agradecimientoBase = await armarAgradecimientoComentario(inc.text, inc.authorName);
        const nombre = inc.authorName ? inc.authorName.trim() : '';
        let textoRespuesta = agradecimientoBase || generarBorradorRespuesta({
          reviewerName: inc.authorName,
          comment: inc.text,
          starRating: estrellas,
        });
        if (nombre && !textoRespuesta.toLowerCase().includes(nombre.toLowerCase())) {
          textoRespuesta = `¡Hola ${nombre}! ${textoRespuesta}`;
        }
        textoRespuesta = sanitizarTextoRespuesta(textoRespuesta);

        if (creds.accessToken && creds.accountLocationId) {
          const pub = await replyToGoogleBusinessReview({
            accessToken: creds.accessToken,
            accountLocationId: creds.accountLocationId,
            reviewId: inc.networkCommentId,
            comment: textoRespuesta,
          });
          if (pub.success) {
            inc.respuestaAutomatica = { texto: textoRespuesta, at: nowIso };
            inc.respondidoAt = nowIso;
          }
        }
      }
    } else {
      // 1-3 estrellas: NO contesta sola, prepara borrador con IA y avisa al dueño
      if (!inc.borradorRespuesta) {
        inc.borradorRespuesta = await armarBorradorResenaNegativaIA(inc);
      }
      if (!inc.alertaDuenioEnviadaAt) {
        await alertarDuenioPorComentarioNegativo({
          text: `${inc.text}\n📝 Borrador listo: "${inc.borradorRespuesta}"`,
          authorName: inc.authorName,
          permalink: inc.permalink,
          postUrl: inc.postUrl,
          sentimentReason: inc.sentimentReason || `Reseña de ${estrellas} estrellas en Google`,
          network: 'Google',
        }).catch((err) => console.warn('[syncComments] Error alertando al dueño por reseña Google:', err));
        inc.alertaDuenioEnviadaAt = nowIso;
      }
    }
    return inc;
  }

  // B. Quejas, negativos, insultos o spam: ocultar sólo cuando sea insulto/spam o recomendado (NUNCA dar me gusta, NUNCA privado, NUNCA contestar solo)
  if (esNegativoOQueja || esInsultoOSpam) {
    const ocultarHabilitado = ajustes.ocultar !== false && ajustes.porRed?.[inc.network]?.ocultar !== false;
    const debeOcultar = esInsultoOSpam || Boolean(inc.autoHideRecommended);
    if (debeOcultar && ocultarHabilitado && !inc.isAutoHidden && !inc.isManuallyRestored) {
      inc.isAutoHidden = true;
      inc.autoHiddenReason =
        inc.sentimentReason ||
        (esNegativoOQueja
          ? 'Ocultado preventivamente por queja o comentario negativo'
          : 'Ocultado automáticamente por moderación');
      inc.autoHiddenAt = nowIso;
      inc.ocultoAt = nowIso;

      const metaToken =
        inc.network === 'Facebook'
          ? fbConn?.pageAccessToken
          : inc.network === 'Instagram'
            ? igConn?.pageAccessToken
            : undefined;
      if (metaToken) {
        await hideCommentOnMeta(inc.networkCommentId, metaToken);
      }
    }

    if (esNegativoOQueja && !inc.alertaDuenioEnviadaAt) {
      await alertarDuenioPorComentarioNegativo({
        text: inc.text,
        authorName: inc.authorName,
        permalink: inc.permalink,
        postUrl: inc.postUrl,
        sentimentReason: inc.sentimentReason,
        network: inc.network,
      }).catch((err) => console.warn('[syncComments] Error alertando al dueño:', err));
      inc.alertaDuenioEnviadaAt = nowIso;
    }

    return inc;
  }

  if (inc.isAutoHidden || inc.isDeleted) {
    return inc;
  }

  // C. Palabras clave (Orden 327 Bloque 1): FECHA, PRECIO, INFO, PRESUPUESTO (solo FB e IG, <= 7 días)
  const esMeta = inc.network === 'Facebook' || inc.network === 'Instagram';
  const connMeta = inc.network === 'Facebook' ? fbConn : inc.network === 'Instagram' ? igConn : undefined;
  const tokenMeta = connMeta?.pageAccessToken || connMeta?.accessToken;
  const pageIdMeta =
    inc.network === 'Facebook'
      ? fbConn?.pageId
      : (igConn?.pageId || fbConn?.pageId || igConn?.instagramAccountId);

  const palabraClave = esMeta && ajustes.palabrasClaveActivo !== false
    ? detectarPalabraClave(inc.text, ajustes.palabrasClave)
    : null;

  if (palabraClave && esMeta) {
    const creadoMs = new Date(inc.createdAt).getTime();
    const dentroDeSieteDias = Number.isNaN(creadoMs) || (ahoraMs - creadoMs <= SIETE_DIAS_MS);

    if (!inc.privadoEnviadoAt && dentroDeSieteDias && tokenMeta && pageIdMeta) {
      const textoPrivado = armarMensajePrivadoPalabraClave(inc);
      const privadoOk = await sendPrivateReplyToMetaComment({
        pageId: pageIdMeta,
        commentId: inc.networkCommentId,
        message: textoPrivado,
        accessToken: tokenMeta,
      });

      if (privadoOk) {
        inc.privadoEnviadoAt = nowIso;
        inc.palabraClave = palabraClave;

        // Respuesta pública corta sin precios ni fechas
        if (!inc.respuestaAutomatica && ajustes.activo && ajustes.porRed?.[inc.network]?.comentarios !== false) {
          const respuestaPublica = '¡Te escribimos por privado! 💬';
          const pubOk = await postReplyToMetaComment(
            inc.networkCommentId,
            inc.network,
            respuestaPublica,
            tokenMeta,
          );
          if (pubOk) {
            inc.respuestaAutomatica = { texto: respuestaPublica, at: nowIso };
            inc.respondidoAt = nowIso;
          }
        }
      }
    }

    // Dar me gusta en Facebook si está prendido
    if (
      inc.network === 'Facebook' &&
      !inc.meGustaAt &&
      ajustes.meGusta !== false &&
      ajustes.porRed?.Facebook?.meGusta !== false &&
      tokenMeta
    ) {
      const likeOk = await darMeGustaComentarioFacebook(inc.networkCommentId, tokenMeta);
      if (likeOk) {
        inc.meGustaAt = nowIso;
      }
    }

    return inc;
  }

  // D. Positivo / neutro / pregunta: Me gusta en Facebook + Respuesta automática
  if (
    inc.network === 'Facebook' &&
    !inc.meGustaAt &&
    ajustes.meGusta !== false &&
    ajustes.porRed?.Facebook?.meGusta !== false &&
    tokenMeta
  ) {
    const likeOk = await darMeGustaComentarioFacebook(inc.networkCommentId, tokenMeta);
    if (likeOk) {
      inc.meGustaAt = nowIso;
    }
  }

  if (!inc.respuestaAutomatica) {
    await responderComentarioSiAplica(inc, conns);
  }

  return inc;
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
  const ytConn = connections.find((c) => c.platform === 'YouTube');
  const thConn = connections.find((c) => c.platform === 'Threads') || { platform: 'Threads', isConnected: false };

  const currentStates = await getCommentsBackfillState();
  const existingComments = await readData<SocialComment[]>(COMMENTS_FILE, []);
  const existingMap = new Map(existingComments.map((c) => [c.id, c]));
  // Foto de cada comentario como estaba al leer: al final se guarda SOLO lo que cambio la
  // sincronizacion, fusionado por id sobre la lista de ese momento (no la lista entera).
  const antesDeSincronizar = new Map(existingComments.map((c) => [c.id, JSON.parse(JSON.stringify(c)) as SocialComment]));

  // 1. Ejecutar sync por red (sin que el fallo de una rompa las demás)
  const [fbResult, igResult, ytResult, googleResult, threadsResult] = await Promise.all([
    syncFacebookComments(fbConn, currentStates.Facebook, isFull),
    syncInstagramComments(igConn, currentStates.Instagram, isFull),
    syncYouTubeComments(ytConn, currentStates.YouTube, isFull),
    syncGoogleReviews(connections, currentStates.Google),
    syncThreadsComments(thConn, currentStates.Threads, isFull),
  ]);

  const allIncoming = [
    ...fbResult.comments,
    ...igResult.comments,
    ...ytResult.comments,
    ...googleResult.comments,
    ...threadsResult.comments,
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
    const estabaOculto = Boolean(inc.isAutoHidden);

    if (inc.network === 'Google' && typeof inc.starRating === 'number') {
      totalClasificados++;
      await procesarComentarioRedes(inc, { connections });
    } else {
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
      await procesarComentarioRedes(inc, { connections, clasificacionPrevia: clasif });
    }

    if (!estabaOculto && inc.isAutoHidden) {
      totalAutoHidden++;
    }
  }

  // Pasada diaria / barrido: todo comentario sin responder de más de 24h que no sea queja/spam/negativo recibe respuesta
  const ahoraMs = Date.now();
  const unDiaMs = 24 * 60 * 60 * 1000;
  for (const c of existingMap.values()) {
    if (c.respuestaAutomatica) continue;
    if (c.isDeleted || c.isAutoHidden) continue;
    if (!c.classifiedAt || !c.sentiment) continue;
    if (c.isInsultOrSpam || c.isLegitimateComplaint || c.sentiment === 'negativo') continue;
    const creadoMs = new Date(c.createdAt).getTime();
    if (Number.isNaN(creadoMs)) continue;
    if (ahoraMs - creadoMs >= unDiaMs) {
      await procesarComentarioRedes(c, { connections });
    }
  }

  const pendientesDeClasificar = Math.max(0, sinRevisar.length - totalClasificados);

  const parches = Array.from(existingMap.values())
    .map((completo) => ({
      id: completo.id,
      completo,
      parche: parcheEntre(antesDeSincronizar.get(completo.id) ?? {}, completo),
    }))
    .filter((p) => !antesDeSincronizar.has(p.id) || Object.keys(p.parche).length > 0);
  if (parches.length > 0) {
    const guardado = await mutarComentarios((lista) => aplicarParches(lista, parches));
    if (!guardado) throw new Error('No se pudieron guardar los comentarios sincronizados.');
  }

  const newStates: Record<CommentNetwork, NetworkCommentsBackfillState> = {
    Facebook: { ...fbResult.state, newCommentsCount: fbResult.comments.length },
    Instagram: { ...igResult.state, newCommentsCount: igResult.comments.length },
    YouTube: { ...ytResult.state, newCommentsCount: ytResult.comments.length },
    Google: { ...googleResult.state, newCommentsCount: googleResult.comments.length },
    Threads: { ...threadsResult.state, newCommentsCount: threadsResult.comments.length },
    TikTok: { ...currentStates.TikTok, exhausted: true, error: 'Esta red no deja contestar desde otra aplicación' },
    Pinterest: { ...currentStates.Pinterest, exhausted: true, error: 'Esta red no deja contestar desde otra aplicación' },
    X: { ...currentStates.X, exhausted: true, error: 'Esta red no deja contestar desde otra aplicación' },
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

  // Despues de hablar con Meta se vuelve a leer la lista y se cambia SOLO este comentario.
  const restauradoEn = new Date().toISOString();
  const guardado = await mutarComentarios((lista) => {
    const actual = lista.find((c) => c.id === commentId);
    if (!actual) return null;
    return lista.map((c) => (c.id === commentId
      ? { ...c, isAutoHidden: false, isManuallyRestored: true, manuallyRestoredAt: restauradoEn }
      : c));
  });
  if (!guardado) return { success: false, error: 'Comentario no encontrado.' };
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

  const ocultadoEn = new Date().toISOString();
  const guardado = await mutarComentarios((lista) => {
    const actual = lista.find((c) => c.id === commentId);
    if (!actual) return null;
    return lista.map((c) => (c.id === commentId
      ? { ...c, isAutoHidden: true, autoHiddenReason: 'Ocultado manualmente por el dueño', autoHiddenAt: ocultadoEn, ocultoAt: ocultadoEn }
      : c));
  });
  if (!guardado) return { success: false, error: 'Comentario no encontrado.' };
  return { success: true };
}
