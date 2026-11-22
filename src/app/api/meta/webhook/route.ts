import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import type { MetaMensajeDirecto } from '@/lib/mensajes/bandeja-unica';
import { clavesIguales } from '@/lib/security/claves-iguales';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { buildCrmMensaje } from '@/lib/crm/conversacion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCHIVO_MENSAJES = 'social-mensajes-directos.json';

async function conTimeout<T>(promesa: Promise<T>, ms = 1200): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promesa,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout tras ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function obtenerMetaAppSecret(): string | null {
  return process.env.META_APP_SECRET || process.env.META_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || null;
}

function verificarFirmaMeta(rawBody: string, signature: string | null, appSecret: string | null): boolean {
  if (!signature || !appSecret) return false;
  try {
    const expected = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}

/**
 * GET /api/meta/webhook
 * Validación de webhook de Meta (Instagram Messaging / Messenger).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: 'Webhook de Meta sin clave de verificación configurada.' }, { status: 403 });
  }

  if (mode === 'subscribe' && challenge) {
    if (clavesIguales(token, expectedToken)) {
      return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Token de verificación de Meta inválido.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, mensaje: 'Meta Webhook endpoint activo' });
}

/**
 * POST /api/meta/webhook
 * Recepción de mensajes directos de Instagram y Messenger.
 * Comprueba X-Hub-Signature-256, determina canal por payload.object y muta transaccionalmente con mutateGenericJsonArray.
 */
export async function POST(request: NextRequest) {
  // 1. Obtener cuerpo crudo para validar la firma HMAC-SHA256
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || request.headers.get('X-Hub-Signature-256');
  const secret = obtenerMetaAppSecret();

  // Validación estricta de X-Hub-Signature-256: sin clave configurada en el servidor, se rechaza todo.
  if (!secret || !verificarFirmaMeta(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: 'Firma X-Hub-Signature-256 inválida o ausente' },
      { status: 403 }
    );
  }

  // 2. Parsear evento de Meta
  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud JSON inválido' }, { status: 400 });
  }

  const entries = payload.entry || [];
  const incomingMessages: MetaMensajeDirecto[] = [];

  // Determinación de canal según el objeto principal de Meta (Codex 171/205)
  // payload.object === 'instagram' -> instagram_dm; caso contrario (ej: 'page') -> messenger.
  const canal: 'instagram_dm' | 'messenger' = payload.object === 'instagram' ? 'instagram_dm' : 'messenger';
  const canalComentario: 'instagram_comentario' | 'facebook_comentario' =
    payload.object === 'instagram' ? 'instagram_comentario' : 'facebook_comentario';
  const socialSource = payload.object === 'instagram' ? 'instagram' : 'facebook';

  interface IncomingCommentEvent {
    commentId: string;
    authorId?: string;
    authorName?: string;
    texto: string;
    fecha: string;
    postId?: string;
  }
  const incomingComments: IncomingCommentEvent[] = [];

  for (const entry of entries) {
    const messaging = entry.messaging || [];
    for (const msg of messaging) {
      if (msg.message?.is_echo) continue;
      const mid = msg.message?.mid;
      const texto = msg.message?.text;
      const senderId = msg.sender?.id;
      const recipientId = msg.recipient?.id;
      const senderName = msg.sender?.name || msg.sender?.username;

      const attachments = msg.message?.attachments || [];
      // Sólo una mención en una historia es `story_mention`. Antes también contaba cualquier adjunto con dirección
      // (`payload.url`): una foto o un audio de un prospecto por privado se tomaba como mención, se agradecía y se
      // descartaba sin llegar al CRM (auditoría externa 21/11/2026).
      const storyMentionAtt = attachments.find((att: any) => att.type === 'story_mention');
      if (storyMentionAtt) {
        const storyUrl = storyMentionAtt.payload?.url || storyMentionAtt.url || '';
        if (storyUrl) {
          try {
            // Save to social-story-mentions.json
            // Primero se guarda y se sabe si es nueva: el mismo aviso repetido por Meta no agradece dos veces.
            let esNueva = false;
            await mutateGenericJsonArray<any>('social-story-mentions.json', (mentions) => {
              const existe = mentions.some((m: any) => m.url === storyUrl || (m.senderId === senderId && Math.abs(new Date(m.fecha).getTime() - Date.now()) < 3600000));
              if (existe) return null;
              esNueva = true;
              return [
                {
                  id: `mention_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  url: storyUrl,
                  senderId: senderId || 'anonimo',
                  senderName: senderName || 'Usuario de Instagram',
                  fecha: new Date().toISOString(),
                  compartidoEnMiHistoria: false,
                },
                ...mentions,
              ];
            });


            // Check settings or default to true for "Agradecer menciones"
            const { getAjustesRespuestasComentarios } = await import('@/lib/social-media/comments-backfill');
            const ajustesComentarios = await getAjustesRespuestasComentarios().catch(() => ({ agradecerMenciones: true }));
            const agradecer = ajustesComentarios.agradecerMenciones ?? true;
            if (esNueva && agradecer && senderId) {
              // Send thank you via Meta Graph API if access token is available
              const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
              if (pageAccessToken && senderId) {
                await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: "¡Gracias por compartirnos! 🙌" }
                  })
                }).catch((e) => console.warn('[Meta webhook] Paso secundario sin completar:', e));
              }
            }

            // No se anota en la fiesta: reescribir fiestas.json desde un aviso de Meta pisaba cobros
            // guardados al mismo tiempo, y el nombre parcial confundía invitados (revisión de la 1451).
          } catch (err) {
            console.warn('[Meta Webhook] Error procesando story_mention:', err);
          }
        }
        continue; // No guardar como mensaje directo vacío
      }

      if (!mid) continue;
      if (senderId && entry.id && senderId === entry.id) continue;

      incomingMessages.push({
        mid,
        canal,
        senderId: senderId || 'anonimo',
        ...(senderName ? { senderName } : {}),
        recipientId: recipientId || 'ak_page',
        texto: texto || '',
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
        contestado: false,
      });
    }

    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;
      const isIgComment = change.field === 'comments';
      const isFbComment = change.field === 'feed' && value.item === 'comment' && value.verb !== 'remove' && value.verb !== 'hide';
      if (!isIgComment && !isFbComment) continue;

      const commentId = String(value.id || value.comment_id || '').trim();
      const texto = String(value.text || value.message || '').trim();
      const authorId = value.from?.id ? String(value.from.id) : undefined;
      const authorName = value.from?.name || value.from?.username;

      if (!commentId || !texto) continue;
      if (authorId && entry.id && authorId === String(entry.id)) continue;

      incomingComments.push({
        commentId,
        authorId,
        authorName,
        texto,
        fecha: value.created_time
          ? new Date(typeof value.created_time === 'number' ? value.created_time * 1000 : value.created_time).toISOString()
          : new Date().toISOString(),
        postId: value.post_id || value.media?.id,
      });
    }
  }

  let agregadosCount = 0;
  let crmActualizados = 0;
  let respuestasEnviadas = 0;
  let mensajesNuevos: MetaMensajeDirecto[] = [];

  if (incomingMessages.length > 0) {
    await mutateGenericJsonArray<MetaMensajeDirecto>(ARCHIVO_MENSAJES, (guardados) => {
      const midsExistentes = new Set(guardados.map((m) => m.mid));
      const paraAgregar = incomingMessages.filter((m) => !midsExistentes.has(m.mid));
      agregadosCount = paraAgregar.length;
      mensajesNuevos = paraAgregar;
      if (agregadosCount === 0) return null;
      return [...guardados, ...paraAgregar];
    });

    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || '';

    for (const dm of mensajesNuevos) {
      try {
        const displayName = dm.senderName || `${dm.canal === 'instagram_dm' ? 'Instagram' : 'Messenger'} ${dm.senderId.slice(-4)}`;
        const { lead } = await conTimeout(upsertPublicCommercialLead({
          name: displayName,
          phone: '',
          permitirSinTelefono: true,
          claveSinTelefono: `${dm.canal}:${dm.senderId}`,
          acquisition: { source: socialSource, entryPath: dm.canal },
          atiende: 'asistente',
          mensajesConversacion: [
            buildCrmMensaje({
              idExterno: `meta_dm_${dm.mid}`,
              canal: dm.canal,
              direccion: 'entrante',
              texto: dm.texto,
              fecha: dm.timestamp,
              autor: displayName,
              meta: { mid: dm.mid, senderId: dm.senderId },
            }),
          ],
        }));
        const [
          { enriquecerLeadExistenteConIA, registrarMensajeYAnalizarProspecto },
          { getAjustesRespuestasComentarios },
          { atenderProspectoUnificado, verificarLeadPidePersona },
        ] = await Promise.all([
          import('@/lib/crm/ia-prospecto'),
          import('@/lib/social-media/comments-backfill'),
          import('@/lib/whatsapp/asistente-de-prospectos'),
        ]);

        const [, ajustesDm, pidePersonaEnCrm] = await Promise.all([
          conTimeout(enriquecerLeadExistenteConIA({
            leadId: lead.id,
            mensaje: dm.texto,
            canal: dm.canal,
          })).catch((e) => console.warn('[Meta webhook] Paso secundario sin completar:', e)),
          conTimeout(getAjustesRespuestasComentarios()).catch(() => ({ mensajesDirectos: true })),
          conTimeout(verificarLeadPidePersona(dm.canal, dm.senderId)).catch(() => false),
        ]);
        crmActualizados++;

        const dmActivo = ajustesDm?.mensajesDirectos !== false;
        if (dmActivo && !pidePersonaEnCrm && lead.atiende !== 'persona' && dm.texto.trim()) {
          const resultado = await atenderProspectoUnificado({
            canal: dm.canal,
            remitenteId: dm.senderId,
            nombre: displayName,
            texto: dm.texto,
            messageId: dm.mid,
          });
          if (!resultado.silenciado && resultado.respuesta) {
            await registrarMensajeYAnalizarProspecto({
              leadId: lead.id,
              analizar: false,
              mensaje: buildCrmMensaje({
                canal: dm.canal,
                direccion: 'saliente',
                texto: resultado.respuesta,
                fecha: new Date().toISOString(),
                autor: 'Asistente AK',
                respondidoPor: 'asistente',
                meta: { senderId: dm.senderId },
              }),
            }).catch((e) => console.warn('[Meta webhook] No se pudo guardar respuesta en CRM:', e));

            if (pageAccessToken && dm.senderId) {
              const sendRes = await fetch(
                `https://graph.facebook.com/v18.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: dm.senderId },
                    message: { text: resultado.respuesta },
                  }),
                },
              ).catch((e) => {
                console.warn('[Meta webhook] No se pudo enviar respuesta por Meta API:', e);
                return null;
              });
              if (sendRes?.ok) {
                respuestasEnviadas++;
                await mutateGenericJsonArray<MetaMensajeDirecto>(ARCHIVO_MENSAJES, (guardados) => {
                  let cambio = false;
                  const next = guardados.map((m) => {
                    if (m.mid === dm.mid && !m.contestado) {
                      cambio = true;
                      return { ...m, contestado: true, contestadoPor: 'solo' as const };
                    }
                    return m;
                  });
                  return cambio ? next : null;
                }).catch((e) => console.warn('[Meta webhook] No se pudo marcar DM contestado:', e));
              } else if (sendRes) {
                console.warn('[Meta webhook] Meta API devolvió error al enviar DM:', sendRes.status);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Meta Webhook] No se pudo guardar DM en el CRM:', err);
      }
    }
  }

  if (incomingComments.length > 0) {
    await mutateGenericJsonArray<any>('social-comments.json', (guardados) => {
      const idsExistentes = new Set(guardados.map((c: any) => c.id || c.commentId));
      const paraAgregar = incomingComments.filter((c) => !idsExistentes.has(c.commentId)).map((c) => ({
        id: c.commentId,
        commentId: c.commentId,
        network: payload.object === 'instagram' ? 'instagram' : 'facebook',
        authorName: c.authorName || 'Anónimo',
        authorId: c.authorId,
        text: c.texto,
        timestamp: c.fecha,
        postId: c.postId,
        status: 'para vos',
        liked: false,
        hidden: false,
      }));
      if (paraAgregar.length === 0) return null;
      return [...paraAgregar, ...guardados];
    }).catch((e) => console.warn('[Meta webhook] Paso secundario sin completar:', e));

    for (const c of incomingComments) {
      try {
        const { clasificarComentario } = await import('@/lib/social-media/clasificador-comentarios');
        const clasif = await conTimeout(clasificarComentario(c.texto, c.authorName));
        if (!clasif?.esPregunta) continue;

        const displayName = c.authorName || 'Usuario en redes';
        const { lead } = await conTimeout(upsertPublicCommercialLead({
          name: displayName,
          phone: '',
          permitirSinTelefono: true,
          claveSinTelefono: `${canalComentario}:${c.authorId || displayName}`,
          acquisition: { source: socialSource, entryPath: canalComentario },
          atiende: 'asistente',
          mensajesConversacion: [
            buildCrmMensaje({
              idExterno: `meta_comment_${c.commentId}`,
              canal: canalComentario,
              direccion: 'entrante',
              texto: c.texto,
              fecha: c.fecha,
              autor: displayName,
              meta: {
                commentId: c.commentId,
                ...(c.postId ? { postId: c.postId } : {}),
              },
            }),
          ],
        }));
        const { enriquecerLeadExistenteConIA } = await import('@/lib/crm/ia-prospecto');
        await conTimeout(enriquecerLeadExistenteConIA({
          leadId: lead.id,
          mensaje: c.texto,
          canal: canalComentario,
        })).catch((e) => console.warn('[Meta webhook] Paso secundario sin completar:', e));
        crmActualizados++;
      } catch (err) {
        console.warn('[Meta Webhook] No se pudo guardar comentario en el CRM:', err);
      }
    }
  }

  return NextResponse.json({ status: 'EVENT_RECEIVED', guardados: agregadosCount, crmActualizados, respuestasEnviadas }, { status: 200 });
}
