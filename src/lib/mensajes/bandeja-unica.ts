/**
 * Bandeja Única de Mensajes y Redes Sociales.
 * Junta en una sola lista ordenada por fecha:
 * - Conversaciones de WhatsApp (whatsapp-conversations.json)
 * - Comentarios de Instagram y Facebook (social-comments.json)
 * - Mensajes directos de Instagram y Messenger (social-mensajes-directos.json)
 * - Reseñas de Google (google-reviews.json)
 *
 * Busca en el CRM/Clientes por teléfono o nombre para marcar si es cliente o prospecto.
 */

import { readData, writeData } from '@/lib/data-service';
import { getAjustesRespuestasComentarios } from '@/lib/social-media/comments-backfill';
import { atenderProspectoUnificado } from '@/lib/whatsapp/asistente-de-prospectos';

export type CanalMensaje =
  | 'whatsapp'
  | 'instagram_comentario'
  | 'facebook_comentario'
  | 'instagram_dm'
  | 'messenger'
  | 'google_review';

export interface MensajeBandeja {
  id: string;
  canal: CanalMensaje;
  autor: string;
  contacto?: string;
  texto: string;
  fecha: string;
  esCliente: boolean;
  esProspecto: boolean;
  estado: 'contestado_solo' | 'contestado_persona' | 'pendiente';
  tipoContestacion: 'solo' | 'persona' | 'ninguno';
  propuestaIA?: string;
  detalles?: Record<string, any>;
}

export interface MetaMensajeDirecto {
  mid: string;
  canal: 'instagram_dm' | 'messenger';
  senderId: string;
  senderName?: string;
  recipientId: string;
  texto: string;
  timestamp: string;
  contestado?: boolean;
  contestadoPor?: 'solo' | 'persona';
}

const ARCHIVO_MENSAJES_DIRECTOS = 'social-mensajes-directos.json';
const ARCHIVO_TOPES_RESPUESTAS = 'asistente/tope-respuestas-redes.json';

/**
 * Lee y consolida todos los mensajes de todos los canales en una sola lista ordenada.
 */
export async function leerBandejaUnica(): Promise<MensajeBandeja[]> {
  const [
    whatsappData,
    socialComments,
    directMessages,
    googleReviews,
    presupuestos,
    crmLeads,
  ] = await Promise.all([
    readData<any>('whatsapp-conversations.json', []),
    readData<any[]>('social-comments.json', []),
    readData<MetaMensajeDirecto[]>(ARCHIVO_MENSAJES_DIRECTOS, []),
    readData<any[]>('google-reviews.json', []),
    readData<any[]>('presupuestos.json', []),
    readData<any[]>('crm-leads.json', []),
  ]);

  // Sets de teléfonos y nombres de clientes confirmados y prospectos
  const telefonosClientes = new Set<string>();
  const nombresClientes = new Set<string>();
  const telefonosProspectos = new Set<string>();

  for (const p of presupuestos || []) {
    if (p.clienteContacto) telefonosClientes.add(normalizarTelefono(p.clienteContacto));
    if (p.clienteNombre) nombresClientes.add(p.clienteNombre.toLowerCase().trim());
  }

  for (const l of crmLeads || []) {
    if (l.telefono || l.phone) telefonosProspectos.add(normalizarTelefono(l.telefono || l.phone));
  }

  const bandeja: MensajeBandeja[] = [];
  const idsExternosVistos = new Set<string>();
  const textosWhatsappVistos = new Set<string>();

  const registrarIdVisto = (rawId?: unknown) => {
    if (typeof rawId !== 'string' || !rawId.trim()) return;
    const id = rawId.trim();
    idsExternosVistos.add(id);
    for (const prefix of ['meta_dm_', 'wa_', 'meta_comment_']) {
      if (id.startsWith(prefix)) {
        idsExternosVistos.add(id.slice(prefix.length));
      }
    }
  };

  // 0. Fuente única unificada: `lead.conversacion` en `crm-leads.json`
  const canalesBandeja = new Set<CanalMensaje>([
    'whatsapp',
    'instagram_dm',
    'messenger',
    'instagram_comentario',
    'facebook_comentario',
  ]);

  for (const lead of crmLeads || []) {
    const telefonoLead = normalizarTelefono(lead.telefono || lead.phone || '');
    const esCli =
      (telefonoLead && telefonosClientes.has(telefonoLead)) ||
      (lead.name && nombresClientes.has(lead.name.toLowerCase().trim()));
    const conversacion = Array.isArray(lead.conversacion) ? lead.conversacion : [];

    for (let idx = 0; idx < conversacion.length; idx++) {
      const msg = conversacion[idx];
      if (!msg || !canalesBandeja.has(msg.canal as CanalMensaje)) continue;
      if (msg.direccion === 'sistema') continue;

      registrarIdVisto(msg.idExterno);
      registrarIdVisto(msg.meta?.mid);
      registrarIdVisto(msg.meta?.messageId);
      registrarIdVisto(msg.meta?.commentId);

      if (msg.canal === 'whatsapp' && telefonoLead && msg.texto) {
        textosWhatsappVistos.add(`${telefonoLead}|${String(msg.texto).trim()}`);
      }

      if (msg.direccion === 'saliente') continue;

      const siguienteSaliente = conversacion
        .slice(idx + 1)
        .find((m: any) => m.direccion === 'saliente');
      const contestadoPor =
        msg.respondidoPor ||
        siguienteSaliente?.respondidoPor ||
        (lead.atiende === 'asistente' && siguienteSaliente ? 'asistente' : undefined);

      bandeja.push({
        id: msg.idExterno || msg.id,
        canal: msg.canal as CanalMensaje,
        autor: msg.autor || lead.name || telefonoLead || 'Contacto',
        contacto: telefonoLead || String(msg.meta?.senderId || ''),
        texto: msg.texto || '',
        fecha: msg.fecha || lead.updatedAt || new Date().toISOString(),
        esCliente: Boolean(esCli),
        esProspecto: true,
        estado: contestadoPor === 'asistente'
          ? 'contestado_solo'
          : (siguienteSaliente ? 'contestado_persona' : 'pendiente'),
        tipoContestacion: contestadoPor === 'asistente'
          ? 'solo'
          : (siguienteSaliente ? 'persona' : 'ninguno'),
        propuestaIA: '¡Hola! Gracias por comunicarte con AK Producciones. ¿En qué podemos ayudarte para tu fiesta?',
        detalles: {
          leadId: lead.id,
          idExterno: msg.idExterno,
          ...(msg.meta || {}),
          ...(telefonoLead ? { phone: telefonoLead } : {}),
        },
      });
    }
  }

  // 1. WhatsApp (respaldo legado si no está ya en `lead.conversacion`)
  const rawWhatsapp = Array.isArray(whatsappData)
    ? whatsappData
    : Object.values(whatsappData || {});

  for (const wa of rawWhatsapp) {
    const telefono = normalizarTelefono(wa.phone || wa.clientPhone || wa.targetPhone || wa.id || '');
    const esCli = telefonosClientes.has(telefono) || (wa.name && nombresClientes.has(wa.name.toLowerCase().trim()));
    const esProsp = telefonosProspectos.has(telefono);

    const ultimoMensaje = Array.isArray(wa.messages) && wa.messages.length > 0
      ? wa.messages[wa.messages.length - 1]
      : wa;
    const textoWa = ultimoMensaje.text || ultimoMensaje.content || ultimoMensaje.messageText || wa.lastMessage || 'Conversación WhatsApp';
    const providerId = ultimoMensaje.providerMessageId || ultimoMensaje.id;

    if (providerId && idsExternosVistos.has(String(providerId))) continue;
    if (telefono && textosWhatsappVistos.has(`${telefono}|${String(textoWa).trim()}`)) continue;

    bandeja.push({
      id: wa.id || `wa_${telefono}`,
      canal: 'whatsapp',
      autor: wa.name || wa.clientName || telefono || 'Contacto WhatsApp',
      contacto: telefono,
      texto: textoWa,
      fecha: ultimoMensaje.timestamp || ultimoMensaje.createdAt || wa.updatedAt || new Date().toISOString(),
      esCliente: Boolean(esCli),
      esProspecto: Boolean(esProsp),
      estado: wa.status === 'contestado' || wa.answered ? 'contestado_persona' : 'pendiente',
      tipoContestacion: wa.vinoDePublicidad ? 'solo' : 'ninguno',
      propuestaIA: '¡Hola! Gracias por comunicarte con AK Producciones. ¿En qué podemos ayudarte para tu fiesta?',
      detalles: { phone: telefono, unread: wa.unreadCount || 0 },
    });
  }

  // 2. Comentarios en redes (Instagram & Facebook, evitando duplicados ya en `conversacion`)
  for (const c of socialComments || []) {
    if (
      (c.id && idsExternosVistos.has(String(c.id))) ||
      (c.networkCommentId && idsExternosVistos.has(String(c.networkCommentId)))
    ) {
      continue;
    }
    const autorNom = c.authorName || c.userName || 'Usuario';
    const esCli = nombresClientes.has(autorNom.toLowerCase().trim());

    bandeja.push({
      id: c.id || `sc_${Date.now()}_${Math.random()}`,
      canal: c.platform === 'Facebook' ? 'facebook_comentario' : 'instagram_comentario',
      autor: autorNom,
      contacto: `@${c.userName || autorNom}`,
      texto: c.text || c.message || '',
      fecha: c.createdAt || c.timestamp || new Date().toISOString(),
      esCliente: Boolean(esCli),
      esProspecto: false,
      estado: c.answeredByAI ? 'contestado_solo' : (c.replyText ? 'contestado_persona' : 'pendiente'),
      tipoContestacion: c.answeredByAI ? 'solo' : (c.replyText ? 'persona' : 'ninguno'),
      propuestaIA: c.aiSuggestedReply || '¡Hola! Gracias por escribirnos. Podés consultar disponibilidad y presupuestos en akproducciones.uy',
      detalles: { postId: c.postId, sentiment: c.sentiment },
    });
  }

  // 3. Mensajes directos (Instagram DM & Messenger, evitando duplicados ya en `conversacion`)
  for (const dm of directMessages || []) {
    if (dm.mid && idsExternosVistos.has(String(dm.mid))) {
      continue;
    }
    const esCli = dm.senderName ? nombresClientes.has(dm.senderName.toLowerCase().trim()) : false;

    bandeja.push({
      id: dm.mid || `dm_${Date.now()}`,
      canal: dm.canal || 'instagram_dm',
      autor: dm.senderName || `Usuario ${dm.senderId.slice(-4)}`,
      contacto: dm.senderId,
      texto: dm.texto || '',
      fecha: dm.timestamp || new Date().toISOString(),
      esCliente: Boolean(esCli),
      esProspecto: false,
      estado: dm.contestadoPor === 'solo' ? 'contestado_solo' : (dm.contestado ? 'contestado_persona' : 'pendiente'),
      tipoContestacion: dm.contestadoPor || 'ninguno',
      propuestaIA: '¡Hola! En AK Producciones organizamos fiestas inolvidables en Salto. Cotizá en akproducciones.uy/simulador',
      detalles: { mid: dm.mid, senderId: dm.senderId },
    });
  }

  // 4. Reseñas de Google
  for (const gr of googleReviews || []) {
    const esCli = gr.reviewerName ? nombresClientes.has(gr.reviewerName.toLowerCase().trim()) : false;

    bandeja.push({
      id: gr.id || gr.reviewId || `gr_${Date.now()}`,
      canal: 'google_review',
      autor: gr.reviewerName || 'Usuario de Google',
      contacto: 'Google Maps',
      texto: gr.comment || gr.text || `Calificación: ${gr.starRating || 5} estrellas`,
      fecha: gr.createTime || gr.createdAt || new Date().toISOString(),
      esCliente: Boolean(esCli),
      esProspecto: false,
      estado: gr.reply ? 'contestado_persona' : 'pendiente',
      tipoContestacion: gr.reply ? 'persona' : 'ninguno',
      propuestaIA: '¡Muchas gracias por elegirnos y por compartir tu experiencia con nosotros! Nos alegra haber sido parte de una fiesta tan especial.',
      detalles: { starRating: gr.starRating || 5, reply: gr.reply },
    });
  }

  // Ordenar por fecha decreciente (más reciente primero)
  return bandeja.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/**
 * Normaliza un número de teléfono a dígitos limpios.
 */
function normalizarTelefono(tel: string): string {
  return String(tel || '').replace(/\D/g, '').replace(/^598/, '');
}

/**
 * Reglas de contestación automática según el canal y remitente (Bloque 5).
 * - Comentario en publicación: Sí si es pregunta; Si es elogio: ¡Gracias!; Si es queja: NUNCA solo.
 * - Mensaje directo (Instagram / Messenger): Sí la primera respuesta solo si NO es cliente; Si es cliente contratado: NO.
 * - WhatsApp: Sí sólo si viene de anuncio (correspondeContestarSolo); si es personal / sin anuncio: NUNCA.
 * - Reseña de Google: NUNCA sola (borrador listo para persona).
 * - Interruptor en ajustes: si está apagado, nada sale solo.
 * - Máximo 3 respuestas solas por persona por día.
 * - Texto: JAMÁS contiene "$", "garantía", "24/7" ni "congel".
 */
export async function evaluarRespuestaAutomatica(params: {
  canal: CanalMensaje;
  texto: string;
  remitenteId: string;
  esCliente: boolean;
  vinoDeAnuncio?: boolean;
  nombre?: string;
}): Promise<{
  respondeSolo: boolean;
  respuesta?: string;
  motivo?: string;
  opciones?: string[];
  whatsappUrl?: string;
  budgetUrl?: string;
  atiende?: 'asistente' | 'persona';
}> {
  const { canal, texto, remitenteId, esCliente, vinoDeAnuncio, nombre } = params;
  const textoMin = (texto || '').toLowerCase();

  // 1. Interruptores en Ajustes
  const ajustes = await getAjustesRespuestasComentarios();
  if (canal === 'instagram_comentario' || canal === 'facebook_comentario') {
    if (!ajustes.comentarios) {
      return { respondeSolo: false, motivo: 'interruptor_comentarios_apagado' };
    }
  }

  if (canal === 'instagram_dm' || canal === 'messenger') {
    if (!ajustes.mensajesDirectos) {
      return { respondeSolo: false, motivo: 'interruptor_mensajes_directos_apagado' };
    }
  }

  // 2. Reseñas de Google nunca se contestan solas
  if (canal === 'google_review') {
    return { respondeSolo: false, motivo: 'resenas_requieren_aprobacion_humana' };
  }

  // 3. Cliente con fiesta contratada: NUNCA se le contesta solo en mensajes directos
  if (esCliente && (canal === 'instagram_dm' || canal === 'messenger')) {
    return { respondeSolo: false, motivo: 'cliente_contratado_atencion_personalizada' };
  }

  // 4. WhatsApp: sólo si viene de un anuncio o publicación
  if (canal === 'whatsapp') {
    if (!vinoDeAnuncio) {
      return { respondeSolo: false, motivo: 'whatsapp_personal_sin_anuncio' };
    }
  }

  // 5. Quejas en comentarios o mensajes: NUNCA solas
  const esQueja = /mal|pésim|quej|desastre|estaf|bronca|horrible|reclamo|decepción/i.test(textoMin);
  if (esQueja) {
    return { respondeSolo: false, motivo: 'queja_requiere_atencion_humana' };
  }

  // 6. Tope diario de 3 respuestas por remitente en comentarios públicos
  const hoyStr = new Date().toISOString().split('T')[0];
  const registroTopes = await readData<Record<string, { fecha: string; count: number }>>(ARCHIVO_TOPES_RESPUESTAS, {});
  const userRecord = registroTopes[remitenteId] || { fecha: hoyStr, count: 0 };
  const countHoy = userRecord.fecha === hoyStr ? userRecord.count : 0;

  if (countHoy >= 3) {
    return { respondeSolo: false, motivo: 'tope_diario_respuestas_alcanzado' };
  }

  // 7. Armado de respuesta según el canal
  let respuestaGenerada = '';
  let extraCampos: {
    opciones?: string[];
    whatsappUrl?: string;
    budgetUrl?: string;
    atiende?: 'asistente' | 'persona';
  } = {};

  if (canal === 'instagram_comentario' || canal === 'facebook_comentario') {
    const esPregunta = textoMin.includes('?') || /precio|cuánto|cuanto|donde|dónde|cuándo|cuando|tienen|información|info|fecha|disponib|presupuesto/i.test(textoMin);
    const esElogio = /genial|hermos|excelente|felicitaciones|lindo|crack|amor|capo|bello/i.test(textoMin);

    if (esPregunta) {
      // Comentarios públicos NUNCA dicen precios ni fechas: solo derivan por privado.
      respuestaGenerada = '¡Hola! ¡Te escribimos por privado!';
    } else if (esElogio) {
      respuestaGenerada = '¡Muchas gracias por tu mensaje! ❤️ Nos alegra muchísimo que te guste nuestro trabajo.';
    } else {
      return { respondeSolo: false, motivo: 'comentario_sin_pregunta_ni_elogio' };
    }
  } else if (canal === 'instagram_dm' || canal === 'messenger') {
    const resultado = await atenderProspectoUnificado({
      canal,
      remitenteId,
      texto,
      nombre,
      esCliente,
    });
    if (resultado.silenciado || !resultado.respuesta) {
      return { respondeSolo: false, motivo: resultado.motivo || 'atiende_persona' };
    }
    respuestaGenerada = resultado.respuesta;
    extraCampos = {
      ...(resultado.opciones ? { opciones: resultado.opciones } : {}),
      ...(resultado.whatsappUrl ? { whatsappUrl: resultado.whatsappUrl } : {}),
      ...(resultado.budgetUrl ? { budgetUrl: resultado.budgetUrl } : {}),
      atiende: resultado.atiende,
    };
  } else if (canal === 'whatsapp') {
    respuestaGenerada = '¡Hola! Gracias por contactarte con AK Producciones. Recibimos tu consulta desde nuestro anuncio. Te pasamos el enlace al simulador para armar tu propuesta: akproducciones.uy/simulador.';
  }

  // 8. Sanitización de palabras prohibidas: NUNCA $, garantía, 24/7 ni congel
  respuestaGenerada = sanitizarRespuestaAutomatica(respuestaGenerada);

  // Anotar consumo de tope
  registroTopes[remitenteId] = { fecha: hoyStr, count: countHoy + 1 };
  // no pasa nada si falla: es la cuenta del tope diario; la respuesta ya salió y se cuenta en la próxima.
  await writeData(ARCHIVO_TOPES_RESPUESTAS, registroTopes).catch((e) => console.warn('[bandeja-unica] Paso secundario sin completar:', e));

  return {
    respondeSolo: true,
    respuesta: respuestaGenerada,
    ...extraCampos,
  };
}

/**
 * Garantiza que ninguna respuesta automática tenga $, garantía, 24/7 ni congel.
 */
export function sanitizarRespuestaAutomatica(texto: string): string {
  return texto
    .replace(/\$/g, '')
    .replace(/\bgarant[ií]a(s)?\b/gi, 'compromiso')
    .replace(/\b24\/7\b/gi, 'todos los días')
    .replace(/\bcongel(ar|amos|ado|ada|ás)?\b/gi, 'mantener');
}
