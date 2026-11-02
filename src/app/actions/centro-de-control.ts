'use server';

import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermiso } from '@/lib/auth/require-session';
import { ID_MEMORIA_DUENO, loQueSe, olvidar, recordar } from '@/lib/asistente/memoria';
import {
  getPropuestas,
  aceptarPropuesta,
  aprobarPlanMultipaso,
  descartarNoAvisarMas,
  agregarPropuestasDeduplicadas,
} from '@/lib/asistente/propuestas-service';
import {
  getScheduledMessages,
  markMessageAsSent,
  cancelScheduledMessage,
  updateScheduledMessageText,
} from '@/app/actions/scheduled-messages';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { readData, readDataConDetalle, writeData, mutateDataItem } from '@/lib/data-service';
import { AsyncMutex } from '@/lib/mutex';
import type { SocialPost } from '@/types/social-media';
import {
  getReglasDeLaIA,
  guardarReglaIA,
  getReglaParaTarea,
  registrarAccionSola,
  getRegistroAccionesSolas,
  registrarDecisionDuenio,
  getResumenMensualAprendizaje,
  type ReglaIA,
  type ReglaModo,
} from '@/lib/ia/reglas-de-la-ia';
import {
  getHistorialEjecuciones,
  ejecutarPerseguidorPresupuestos,
} from '@/lib/agentes/motor-agentes';
import { armarWebConIA } from '@/app/actions/fiesta/armar-web-con-ia.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { detectarTipoPlanMultipaso, prepararPlanMultipaso } from '@/lib/asistente/planes-multipaso';
import type { Presupuesto } from '@/types/presupuesto';

export interface ItemOK {
  id: string;
  origen: 'propuesta' | 'mensaje' | 'post';
  tipo: string;
  titulo: string;
  destinatario: string;
  texto: string;
  fecha: string;
  telefono?: string;
  enlaceWhatsapp?: string;
  tipoTarea: string;
}

export interface AccionSolaItem {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  enlace?: string;
}

export interface CentroDeControlDatos {
  paraTuOk: ItemOK[];
  reglas: ReglaIA[];
  loQueHizoSola: AccionSolaItem[];
  resumenMensual: string;
}

const POSTS_FILE = 'social-posts.json';
const POSTS_COLLECTION = 'social_posts';
const turnoDePosts = new AsyncMutex();

/**
 * Cambia UN posteo por su id, sin reemplazar la lista entera: dos aprobaciones a la vez quedan
 * las dos. Con base va en la transacción; en archivos locales, dentro del turno.
 * Devuelve null si el posteo no existe (o `cambiar` devuelve null).
 */
async function mutarPostPorId(
  id: string,
  cambiar: (p: SocialPost) => SocialPost | null,
): Promise<SocialPost | null> {
  if (process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
    return mutateDataItem<SocialPost>(POSTS_FILE, POSTS_COLLECTION, id, cambiar);
  }
  return turnoDePosts.runExclusive(async () => {
    const posts = await readData<SocialPost[]>(POSTS_FILE, []);
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const nuevo = cambiar(posts[idx]);
    if (!nuevo) return null;
    posts[idx] = nuevo;
    await writeData(POSTS_FILE, posts);
    return nuevo;
  });
}

function sinAcentos(t: string): string {
  return (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

type FiestaDeLaOrden = { ok: true; id: string; nombre: string } | { ok: false; mensaje: string };

/** Busca la fiesta que nombra la frase. Nunca inventa una: sin coincidencia clara, lo dice. */
async function resolverFiestaDeLaOrden(frase: string): Promise<FiestaDeLaOrden> {
  let fiestas: FiestaEnPlanificacion[];
  try {
    fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
  } catch {
    return { ok: false, mensaje: 'No pude leer las fiestas para saber cuál es. No se hizo nada.' };
  }
  const f = sinAcentos(frase);
  const coincidencias: { id: string; nombre: string }[] = [];
  for (const fi of Array.isArray(fiestas) ? fiestas : []) {
    const nombre = String(
      fi.configuracion?.nombreEvento || fi.invitacionConfig?.nombreHomenajeada || (fi as any).nombre || '',
    ).trim();
    const norm = sinAcentos(nombre);
    if (norm.length < 3) continue;
    if (f.includes(norm)) coincidencias.push({ id: fi.id, nombre });
  }
  if (coincidencias.length === 0) {
    return {
      ok: false,
      mensaje: 'No encontré una fiesta con ese nombre. Decime cuál es (como figura en la lista de fiestas) y la armo. No se hizo nada.',
    };
  }
  if (coincidencias.length > 1) {
    const nombres = coincidencias.map((c) => c.nombre).join(', ');
    return { ok: false, mensaje: `Hay varias fiestas que coinciden (${nombres}). Decime cuál: no se hizo nada.` };
  }
  return { ok: true, ...coincidencias[0] };
}

/**
 * Junta los datos completos del Centro de Control en una sola llamada:
 * 1) Propuestas del asistente con estado 'pendiente'
 * 2) Mensajes pendientes en scheduled-messages
 * 3) Borradores de redes en social-posts
 * 4) Reglas vigentes de la IA
 * 5) Registro unificado de lo que hizo sola
 * 6) Resumen mensual del aprendizaje
 */
const SLUGS_BLOG_HUMANO = new Set([
  'como-empezar-a-organizar-una-fiesta-sin-estres',
  'presupuesto-de-fiesta-que-debe-incluir',
  'como-elegir-el-menu-para-un-evento',
  'ideas-para-fiesta-de-xv-en-salto',
  'errores-comunes-al-organizar-una-boda',
  'checklist-final-antes-del-evento',
]);

export async function getCentroDeControlDatos(): Promise<CentroDeControlDatos> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    throw new Error(sesion.error || 'Permisos insuficientes: se requiere perfil de administración');
  }

  const tarjetas: ItemOK[] = [];

  // 1. Propuestas del asistente pendientes
  try {
    const propuestas = await getPropuestas();
    const pendientes = (propuestas || []).filter((p) => p.estado === 'pendiente');
    for (const p of pendientes) {
      const tel = p.accion?.data?.telefono || p.accion?.data?.targetPhone || '';
      const texto = p.quePropone || p.quePasa || p.titulo;
      const enlaceWhatsapp = tel
        ? `https://api.whatsapp.com/send?phone=${String(tel).replace(/\D/g, '')}&text=${encodeURIComponent(texto)}`
        : undefined;

      tarjetas.push({
        id: p.id,
        origen: 'propuesta',
        tipo: p.area ? `Propuesta (${p.area})` : 'Propuesta del Asistente',
        titulo: p.titulo,
        destinatario: p.clienteNombre || 'Equipo AK',
        texto,
        fecha: p.createdAt || new Date().toISOString(),
        telefono: tel || undefined,
        enlaceWhatsapp,
        tipoTarea: p.tipoPropuesta || p.clave?.split(':')[0] || 'propuesta',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer propuestas:', error);
  }

  // 2. Mensajes pendientes de WhatsApp o Correo
  try {
    const mensajes = await getScheduledMessages(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    const pendientesMsgs = (mensajes || []).filter(
      (m) => m.status === 'pendiente' || m.status === 'reprogramado'
    );
    for (const m of pendientesMsgs) {
      const tel = m.targetPhone || '';
      const texto = m.messageText || (m as any).messageTemplate || (m as any).body || '';
      const enlaceWhatsapp = tel
        ? `https://api.whatsapp.com/send?phone=${String(tel).replace(/\D/g, '')}&text=${encodeURIComponent(texto)}`
        : undefined;

      tarjetas.push({
        id: m.id,
        origen: 'mensaje',
        tipo: m.channel === 'email' ? 'Correo pendiente' : 'Mensaje de WhatsApp',
        titulo: m.channel === 'email' ? `Correo para ${m.targetName}` : `WhatsApp para ${m.targetName}`,
        destinatario: m.targetName || 'Cliente',
        texto,
        fecha: m.scheduledAt || m.createdAt || new Date().toISOString(),
        telefono: tel || undefined,
        enlaceWhatsapp,
        tipoTarea: (m as any).messageType || 'mandar_mensajes_clientes',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer mensajes programados:', error);
  }

  // 3. Borradores de redes pendientes
  try {
    const posts = await readData<SocialPost[]>('social-posts.json', []);
    const borradores = (posts || []).filter((p) => p.status === 'Borrador');
    for (const p of borradores) {
      tarjetas.push({
        id: p.id,
        origen: 'post',
        tipo: `Redes (${p.platform})`,
        titulo: `Publicación para ${p.platform}${p.eventName ? ` - ${p.eventName}` : ''}`,
        destinatario: `Seguidores de ${p.platform}`,
        texto: p.text || '',
        fecha: p.publishDate || p.createdAt || new Date().toISOString(),
        telefono: undefined,
        enlaceWhatsapp: undefined,
        tipoTarea: 'generador_contenido',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer posts de redes:', error);
  }

  // Ordenar tarjetas por fecha más reciente primero
  tarjetas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // 4. Tus reglas
  const reglas = await getReglasDeLaIA();

  // 5. Lo que hizo sola
  const itemsSola: AccionSolaItem[] = [];
  try {
    const { getBlogPosts } = await import('@/app/actions/blog');
    const blogPosts = await getBlogPosts();
    for (const post of blogPosts || []) {
      const p = post as any;
      const status = String(p.status || '').toLowerCase().trim();

      // Borradores y notas programadas no van en "Lo que hizo sola"
      if (status === 'draft' || status === 'borrador' || p.draft || p.borrador) continue;
      if (status === 'scheduled' || status === 'programado' || status === 'programada') continue;
      if (post.publishedAt && new Date(post.publishedAt).getTime() > Date.now()) continue;

      // Notas escritas por una persona no van
      const autor = String(p.autor || p.author || '').toLowerCase().trim();
      const esHumano = autor === 'persona' || autor === 'humano' || autor === 'manual' || SLUGS_BLOG_HUMANO.has(post.slug);
      if (esHumano) continue;

      // Solo entran las que publicó la IA de verdad (status === 'published' y escritas por IA)
      const esIA = autor === 'ia' || autor === 'ai' || Boolean(post.topicKey) || p.image?.source === 'gemini' || p.generadoPorIA || p.esIA || status === 'published';
      if (!esIA) continue;

      // Si tiene status, debe ser published/publicado
      if (status && status !== 'published' && status !== 'publicado') continue;

      itemsSola.push({
        id: `blog-post-${post.slug}`,
        tipo: 'blog',
        titulo: `Nota de blog: ${post.title}`,
        descripcion: `Publicó la nota "${post.title}" en el blog corporativo.`,
        fecha: post.publishedAt ? `${post.publishedAt}T12:00:00.000Z` : new Date().toISOString(),
        enlace: `/public/blog/${post.slug}`,
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer posts del blog para Lo que hizo sola:', error);
  }
  try {
    const accionesSolas = await getRegistroAccionesSolas();
    for (const a of accionesSolas || []) {
      itemsSola.push({
        id: a.id,
        tipo: a.tareaId,
        titulo: a.que,
        descripcion: a.que,
        fecha: a.fecha,
        enlace: a.enlace || '/centro-de-control',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer acciones solas:', error);
  }

  try {
    const ejecuciones = await getHistorialEjecuciones();
    for (const e of ejecuciones || []) {
      const desc =
        e.accionesPreparadas && e.accionesPreparadas.length > 0
          ? e.accionesPreparadas.join('. ')
          : e.hallazgos && e.hallazgos.length > 0
          ? e.hallazgos.join('. ')
          : 'Revisión automática sin novedades.';
      itemsSola.push({
        id: e.id,
        tipo: e.agenteId,
        titulo: e.agenteNombre,
        descripcion: desc,
        fecha: e.ejecutadoEn,
        enlace: '/centro-de-control',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer historial de ejecuciones:', error);
  }

  itemsSola.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // 6. Resumen mensual
  const resumenMensual = await getResumenMensualAprendizaje();

  return {
    paraTuOk: tarjetas,
    reglas,
    loQueHizoSola: itemsSola,
    resumenMensual,
  };
}

/**
 * Aprueba un ítem de "Para tu OK" y registra la decisión para aprendizaje del dueño.
 */
export async function aprobarItemOK(
  id: string,
  origen: 'propuesta' | 'mensaje' | 'post',
  tipoTarea: string,
  textoPropuesto?: string,
  textoFinal?: string
): Promise<{ success: boolean; error?: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    return { success: false, error: sesion.error || 'Permisos insuficientes' };
  }

  const huboCambio = Boolean(textoFinal && textoFinal.trim() !== '' && textoFinal !== textoPropuesto);

  // Primero se hace lo que se aprobó y recién después se anota la decisión: si falla, no queda
  // anotado como aprobado algo que no pasó.
  if (origen === 'propuesta') {
    if (tipoTarea === 'plan_multi_paso') {
      if (huboCambio) return { success: false, error: 'Para cambiar los pasos o el mensaje, pedí preparar un plan nuevo. Este plan no se ejecutó.' };
      const resultado = await aprobarPlanMultipaso(id, 'Dueño');
      if (!resultado.success) return { success: false, error: resultado.mensaje || 'No se pudo aprobar el plan.' };
      await registrarDecisionDuenio({ tipoTarea, textoPropuesto, textoFinal: huboCambio ? textoFinal : undefined, decision: huboCambio ? 'cambiar' : 'si' });
      return { success: true };
    }
    const res = await aceptarPropuesta(id, 'Dueño', { esDuenio: true });
    if (!res.success) return { success: false, error: res.mensaje || 'No se pudo aceptar la propuesta.' };
  } else if (origen === 'mensaje') {
    let mensajes: Awaited<ReturnType<typeof getScheduledMessages>>;
    try {
      mensajes = await getScheduledMessages(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    } catch {
      return { success: false, error: 'No se pudo leer el mensaje. Probá de nuevo.' };
    }
    const mensaje = (mensajes || []).find((m) => m.id === id);
    if (!mensaje) return { success: false, error: 'Ese mensaje ya no existe.' };
    if (huboCambio) {
      // El texto aprobado queda guardado en el mensaje (es lo que se aprendió y lo que salió).
      const edit = await updateScheduledMessageText(id, textoFinal!);
      if (!edit.success) return { success: false, error: edit.error || 'No se pudo guardar el texto corregido.' };
    }
    if (mensaje.channel === 'email') {
      // Desde acá no sale ningún correo: aprobar no es enviar. Se queda pendiente en la bandeja.
      return {
        success: false,
        error: 'El correo no se manda desde acá: queda pendiente en la bandeja de salida para que lo mandes vos.',
      };
    }
    const res = await markMessageAsSent(id, 'Dueño');
    if (!res.success) return { success: false, error: res.error || 'No se pudo marcar el mensaje como enviado.' };
  } else if (origen === 'post') {
    try {
      const aprobado = await mutarPostPorId(id, (p) => ({
        ...p,
        status: 'Aprobado',
        text: huboCambio ? textoFinal! : p.text,
        updatedAt: new Date().toISOString(),
      }));
      if (!aprobado) return { success: false, error: 'Esa publicación ya no existe.' };
    } catch (err) {
      console.warn('[Centro de Control] Error al aprobar post:', err);
      return { success: false, error: 'No se pudo aprobar la publicación.' };
    }
  } else {
    return { success: false, error: 'No se reconoce qué se quiere aprobar.' };
  }

  await registrarDecisionDuenio({
    tipoTarea,
    textoPropuesto,
    textoFinal: huboCambio ? textoFinal : undefined,
    decision: huboCambio ? 'cambiar' : 'si',
  });

  return { success: true };
}

/**
 * Rechaza un ítem de "Para tu OK" y registra la decisión para aprendizaje del dueño.
 */
export async function rechazarItemOK(
  id: string,
  origen: 'propuesta' | 'mensaje' | 'post',
  tipoTarea: string,
  textoPropuesto?: string
): Promise<{ success: boolean; error?: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    return { success: false, error: sesion.error || 'Permisos insuficientes' };
  }

  if (origen === 'propuesta') {
    const existe = ((await getPropuestas()) || []).some((p) => p.id === id);
    if (!existe) return { success: false, error: 'Esa propuesta ya no existe.' };
    await descartarNoAvisarMas(id);
  } else if (origen === 'mensaje') {
    const res = await cancelScheduledMessage(id, 'Rechazado por el dueño');
    if (!res.success) return { success: false, error: res.error || 'No se pudo descartar el mensaje.' };
  } else if (origen === 'post') {
    try {
      const descartado = await mutarPostPorId(id, (p) => ({
        ...p,
        status: 'Descartado',
        updatedAt: new Date().toISOString(),
      }));
      if (!descartado) return { success: false, error: 'Esa publicación ya no existe.' };
    } catch (err) {
      console.warn('[Centro de Control] Error al rechazar post:', err);
      return { success: false, error: 'No se pudo descartar la publicación.' };
    }
  }

  await registrarDecisionDuenio({
    tipoTarea,
    textoPropuesto,
    decision: 'no',
  });

  return { success: true };
}

/**
 * Guarda el modo de una regla de la IA. Solo permitido para el dueño o administradores.
 */
export async function actualizarReglaIA(
  tareaId: string,
  modo: ReglaModo,
  perfilUsuario?: string
): Promise<{ success: boolean; error?: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    throw new Error(sesion.error || 'Permisos insuficientes para secretaria: solo el dueño puede cambiar reglas');
  }

  const perfilFinal = perfilUsuario || sesion.user?.perfil || 'dueno';
  if (perfilFinal === 'secretaria') {
    throw new Error('Permisos insuficientes para modificar reglas de IA (perfil: secretaria)');
  }

  return await guardarReglaIA(tareaId, modo, 'dueno');
}

/**
 * Procesa órdenes directas por voz o texto del dueño con lenguaje criollo rioplatense.
 */
export async function darOrdenPorVozOTexto(
  frase: string
): Promise<{ success: boolean; mensaje: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    return { success: false, mensaje: sesion.error || 'No tenés permisos para dar órdenes a la IA.' };
  }

  const f = (frase || '').toLowerCase().trim();
  const memoriaId = ID_MEMORIA_DUENO;
  const memoriaDueno = { esDueno: true, puedeVerMemoriaDelDueno: true };
  const guardarRecuerdo = frase.match(/^\s*(?:(?:acordate|ac[uú]erdate|record[aá]|anot[aá]|ten[eé]\s+en\s+cuenta)\s+que)\s+(.+)$/i);
  if (guardarRecuerdo) {
    const resultado = await recordar(memoriaId, guardarRecuerdo[1], undefined, memoriaDueno);
    return {
      success: resultado.guardado,
      mensaje: resultado.guardado
        ? 'Listo, lo guardé en tu memoria personal.'
        : resultado.motivo === 'sensible'
          ? 'No guardé ese dato porque parece una contraseña, información de tarjeta o un dato de salud.'
          : 'No pude guardar un recuerdo vacío.',
    };
  }

  const olvidarCoincide = frase.match(/^\s*olvid[aá]te(?:\s+de)?\s+(.+)$/i);
  if (olvidarCoincide || /^\s*olvid[aá]lo\s*$/i.test(frase)) {
    const borrados = await olvidar(memoriaId, olvidarCoincide?.[1] || 'eso', memoriaDueno);
    return {
      success: true,
      mensaje: borrados ? `Listo, eliminé ${borrados} recuerdo${borrados === 1 ? '' : 's'} de tu memoria.` : 'No encontré un recuerdo sobre ese tema para borrar.',
    };
  }

  const preguntaMemoria = sinAcentos(frase).toLowerCase();
  if (/\b(?:que sabes de(?:l)?|que te acordas de(?:l)?|que recordas de(?:l)?|que tenemos anotado sobre)\b/.test(preguntaMemoria)) {
    const recuerdos = await loQueSe(memoriaId, frase, memoriaDueno);
    return {
      success: true,
      mensaje: recuerdos.length
        ? recuerdos.map((recuerdo) => `• ${recuerdo.sobre ? `${recuerdo.sobre}: ` : ''}${recuerdo.texto}`).join('\n')
        : 'No tengo recuerdos guardados sobre ese tema. Decime “acordate que…” y lo anoto.',
    };
  }

  const tipoPlanSolicitado = detectarTipoPlanMultipaso(frase);
  if (tipoPlanSolicitado) {
    const modo = await getReglaParaTarea('plan_multi_paso');
    if (modo === 'apagada') return { success: false, mensaje: 'Esa tarea está apagada en Tus reglas; no consulté datos ni preparé nada.' };
    const modoSeguimiento = tipoPlanSolicitado === 'seguimiento_presupuestos'
      ? await getReglaParaTarea('perseguidor_presupuestos')
      : undefined;
    if (modoSeguimiento === 'apagada') return { success: false, mensaje: 'El perseguidor está apagado; no consulté presupuestos ni mensajes.' };
    const [fiestas, presupuestos, mensajes, citas] = await Promise.all([
      tipoPlanSolicitado === 'seguimiento_presupuestos'
        ? Promise.resolve(undefined)
        : readDataConDetalle<FiestaEnPlanificacion[]>('fiestas.json', []),
      tipoPlanSolicitado === 'preparar_semana_fiesta'
        ? Promise.resolve(undefined)
        : readDataConDetalle<Presupuesto[]>('presupuestos.json', []),
      tipoPlanSolicitado === 'seguimiento_presupuestos'
        ? readDataConDetalle<import('@/types/whatsapp-automation').ScheduledMessage[]>('scheduled-messages.json', [])
        : Promise.resolve(undefined),
      tipoPlanSolicitado === 'reunion_cliente'
        ? readDataConDetalle<import('@/types/crm').CrmAppointment[]>('crm-appointments.json', [])
        : Promise.resolve(undefined),
    ]);
    const datosPlan = prepararPlanMultipaso(frase, {
      fiestas: fiestas?.valor,
      presupuestos: presupuestos?.valor,
      citas: citas?.valor,
      fallaCitas: Boolean(citas?.huboFalla),
      puedeVerAgenda: true,
      puedeVerPresupuestos: true,
      modoSeguimiento,
      fallaAgenda: Boolean(fiestas?.huboFalla),
      fallaPresupuestos: Boolean(presupuestos?.huboFalla || mensajes?.huboFalla),
      telefonosConMensajePendiente: mensajes?.valor?.filter((m) => m.status === 'pendiente').map((m) => m.targetPhone || ''),
    });
    if (!datosPlan) return { success: false, mensaje: 'No pude identificar el plan solicitado.' };
    if ('pregunta' in datosPlan) return { success: false, mensaje: datosPlan.pregunta };
    const plan = datosPlan.plan;
    const { agregadas } = await agregarPropuestasDeduplicadas([{
      clave: `plan-centro:${plan.tipo}:${plan.fiestaId || plan.clienteNombre || 'general'}:${new Date().toISOString().slice(0, 10)}`,
      area: plan.tipo === 'seguimiento_presupuestos' ? 'ventas' : 'fiestas',
      titulo: plan.titulo,
      quePasa: 'El dueño pidió preparar un plan de varios pasos desde el Centro de control.',
      porQueImporta: 'Se prepara un resumen interno. Ningún cliente recibe mensajes y no se confirma agenda.',
      quePropone: plan.pasos.map((paso, indice) => `${indice + 1}. ${paso}`).join('\n'),
      tipoPropuesta: 'plan_multi_paso', nivelRiesgo: 'pregunta', esImportante: false,
      ...(plan.fiestaId ? { fiestaId: plan.fiestaId } : {}),
      ...(plan.clienteNombre ? { clienteNombre: plan.clienteNombre } : {}),
      accion: { type: 'plan_multi_paso', data: {
        planTipo: plan.tipo,
        ...(plan.fiestaId ? { fiestaId: plan.fiestaId } : {}),
        ...(plan.borrador ? { borrador: plan.borrador } : {}),
        ...(plan.horarioCandidato ? { horarioCandidato: plan.horarioCandidato } : {}),
        pasos: plan.pasos,
      } },
    }]);
    return {
      success: true,
      mensaje: agregadas.length
        ? modo === 'preguntar'
          ? 'Dejé la propuesta de tres pasos en Para tu OK. Aprobarla no agenda ni envía mensajes.'
          : 'Dejé el resumen interno en Para tu OK. No ejecuté tareas, no agendé ni envié mensajes.'
        : 'Ese plan ya está en Para tu OK.',
    };
  }

  // 1. Habla de web / armar web
  if (
    f.includes('web') ||
    f.includes('pagina') ||
    f.includes('página') ||
    f.includes('invitacion') ||
    f.includes('invitación')
  ) {
    const modo = await getReglaParaTarea('armar_web_evento');
    if (modo === 'apagada') {
      return {
        success: false,
        mensaje: 'La tarea de diseñar webs está apagada en tus reglas. Si querés que la haga, prendela antes en "Tus reglas".',
      };
    }

    // La fiesta sale de lo que dijo el dueño: sin coincidencia clara no se arma nada.
    const fiestaOrden = await resolverFiestaDeLaOrden(frase || '');
    if (!fiestaOrden.ok) return { success: false, mensaje: fiestaOrden.mensaje };
    const { id: fiestaId, nombre: nombreFiesta } = fiestaOrden;

    if (modo === 'sola') {
      let armada: Awaited<ReturnType<typeof armarWebConIA>> | null = null;
      let falla: string | null = null;
      try {
        armada = await armarWebConIA(fiestaId);
        if (!armada.success || !armada.invitacionDigital) {
          falla = armada.error || 'No se pudo armar la web.';
        } else {
          const fiesta = await getFiestaById(fiestaId);
          if (!fiesta) {
            falla = 'No se encontró la fiesta para guardar la web.';
          } else {
            const guardado = await saveFiesta({ ...fiesta, invitacionDigital: armada.invitacionDigital });
            if (!guardado.success) falla = guardado.error || 'No se pudo guardar la web.';
          }
        }
      } catch (err) {
        falla = err instanceof Error ? err.message : 'No se pudo armar la web.';
      }

      if (falla) {
        return {
          success: false,
          mensaje: `No pude armar la web de la fiesta de ${nombreFiesta}: ${falla} No se guardó nada.`,
        };
      }

      const esBaseSinIA = Boolean(armada?.esBaseSinIA || (armada?.invitacionDigital as any)?.esBaseSinIA);

      await registrarAccionSola({
        tareaId: 'armar_web_evento',
        que: esBaseSinIA
          ? `Armé una versión base sin IA para la fiesta de ${nombreFiesta}.`
          : `Armé el diseño y textos de la web de invitación para la fiesta de ${nombreFiesta} con la plantilla recomendada.`,
        enlace: `/fiestas/${fiestaId}/pagina-web`,
      });

      return {
        success: true,
        mensaje: esBaseSinIA
          ? 'Armé una versión base sin IA; revisala'
          : `Listo, ya le armé la web a la fiesta de ${nombreFiesta}. Quedó guardada y lista para revisar.`,
      };
    }

    // Modo 'preguntar'
    await agregarPropuestasDeduplicadas([
      {
        clave: `orden-web-${fiestaId}-${Date.now()}`,
        area: 'fiestas',
        titulo: `Armar web para la fiesta de ${nombreFiesta}`,
        quePasa: `Pediste armar la web de la fiesta de ${nombreFiesta}.`,
        porQueImporta: 'Tener la web lista permite a los invitados confirmar su asistencia.',
        quePropone: 'Diseñar la web con plantilla personalizada y textos adaptados al evento.',
        tipoPropuesta: 'armar_web_evento',
        clienteNombre: nombreFiesta,
        fiestaId,
      } as any,
    ]);

    return {
      success: true,
      mensaje: '¡Dale! Como tu regla está en "Preguntame antes", te dejé la propuesta en "Para tu OK" para que le des el visto bueno.',
    };
  }

  // 2. Habla de seguimientos comerciales
  if (
    f.includes('seguimiento') ||
    f.includes('presupuesto') ||
    f.includes('perseguidor')
  ) {
    const modo = await getReglaParaTarea('perseguidor_presupuestos');
    if (modo === 'apagada') {
      return {
        success: false,
        mensaje: 'El perseguidor de presupuestos está apagado en Tus reglas. Prendelo para que prepare los seguimientos.',
      };
    }
    await ejecutarPerseguidorPresupuestos();
    return {
      success: true,
      mensaje: '¡De una! Ya revisé todos los presupuestos y preparé los seguimientos pendientes en la bandeja de salida.',
    };
  }

  // 3. Pregunta por el sábado o pendientes: esta orden no consulta la agenda ni la cocina,
  // así que no afirma horarios ni menús que no miró.
  if (
    f.includes('sabado') ||
    f.includes('sábado') ||
    f.includes('falta') ||
    f.includes('pendiente')
  ) {
    return {
      success: false,
      mensaje: 'Todavía no puedo consultar desde acá el horario ni el menú de una fecha. Mirá la agenda y la ficha de cada fiesta, o pedime una cosa concreta (por ejemplo, armar la web de una fiesta o preparar los seguimientos de presupuestos).',
    };
  }

  // 4. Cualquier otra orden: no se hace nada, y se dice.
  return {
    success: false,
    mensaje: 'No entendí qué querés que haga, así que no hice nada. Probá con: "armá la web de la fiesta de [nombre]" o "preparar los seguimientos de presupuestos".',
  };
}
