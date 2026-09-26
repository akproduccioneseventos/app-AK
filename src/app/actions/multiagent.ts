'use server';

import { saveAgentLearning, listAgentMemoryProfiles } from '@/lib/multiagent/memory-store';
import { appendMultiAgentChatTurn, listMultiAgentChatSessions } from '@/lib/multiagent/chat-store';
import { buildMultiAgentTeamBriefing, summarizeDiagnosticsForLearning } from '@/lib/multiagent/diagnostics';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from '@/lib/notifications/create-notification';
import { verifySession } from '@/lib/auth/session-token';
import { requireAppSession } from '@/lib/auth/require-session';
import type { Tarea } from '@/types/fiesta';
import type { AkAgentChatSession, AkAgentType, AkMultiAgentMessage, AkMultiAgentOutput, AkPersistentMultiAgentOutput } from '@/types/multiagent';

export async function sendMultiAgentMessage(
  message: string,
  history: AkMultiAgentMessage[] = [],
  options?: {
    pathname?: string;
    fiestaId?: string;
    agentType?: AkAgentType;
    imageDataUri?: string;
  }
): Promise<AkMultiAgentOutput> {
  const session = await verifySession();
  if (!session.success) {
    return {
      success: false,
      response: 'Inicia sesion para usar el Multiagente AK.',
      agentType: options?.agentType ?? 'central',
      agentName: 'Multiagente AK',
      action: { type: 'none' },
      error: 'No autorizado',
    };
  }

  try {
    if (!options?.agentType || options?.agentType === 'central') {
      const { ejecutarEncargado } = await import('@/lib/multiagent/encargado');
      return await ejecutarEncargado({
        message,
        history,
        pathname: options?.pathname,
        fiestaId: options?.fiestaId,
        agentType: 'central',
        imageDataUri: options?.imageDataUri,
      });
    }

    const { runMultiAgent } = await import('@/ai/flows/multiagent-flow');
    return await runMultiAgent({
      message,
      history,
      pathname: options?.pathname,
      fiestaId: options?.fiestaId,
      agentType: options?.agentType,
      imageDataUri: options?.imageDataUri,
    });
  } catch (error: any) {
    return {
      success: false,
      response: 'No pude responder con el Multiagente AK. Revisá si la API de Gemini está configurada y probá de nuevo.',
      agentType: options?.agentType ?? 'central',
      agentName: 'Multiagente AK',
      action: { type: 'none' },
      error: error?.message || 'Error desconocido',
    };
  }
}

function buildConversationLearning(input: {
  message: string;
  response: string;
  pathname?: string;
}) {
  return [
    input.pathname ? `Modulo/ruta: ${input.pathname}` : '',
    `Usuario: ${input.message.slice(0, 700)}`,
    `Respuesta del agente: ${input.response.slice(0, 900)}`,
  ].filter(Boolean).join('\n');
}

export async function sendPersistentMultiAgentMessage(input: {
  message: string;
  history?: AkMultiAgentMessage[];
  pathname?: string;
  fiestaId?: string;
  agentType?: AkAgentType;
  imageDataUri?: string;
  sessionId?: string;
}): Promise<AkPersistentMultiAgentOutput> {
  // La ruta /api/multiagent/message ya pide sesion, pero esta funcion tambien es
  // una direccion de internet por su cuenta: sin esto, cualquiera la llama de
  // costado y nos gasta la inteligencia artificial en cada pedido.
  const sesion = await verifySession();
  if (!sesion.success) {
    return {
      success: false,
      response: 'Sesion no autorizada.',
      agentType: input.agentType ?? 'central',
      agentName: 'AK',
      error: 'Sesion no autorizada.',
    };
  }

  const result = await sendMultiAgentMessage(input.message, input.history ?? [], {
    pathname: input.pathname,
    fiestaId: input.fiestaId,
    agentType: input.agentType,
    imageDataUri: input.imageDataUri,
  });

  // Ejecutar acciones reales detectadas por la IA
  if (result.success && result.action && result.action.type !== 'none') {
    const action = result.action;
    try {
      if (action.type === 'create_task') {
        const data = action.data as any;
        if (input.fiestaId) {
          const taskRes = await crearTareaDesdeMultiagente({
            fiestaId: input.fiestaId,
            texto: data.texto || 'Nueva tarea',
            descripcion: data.descripcion,
            fechaLimite: data.fechaLimite,
            asignadaA: data.asignadaA || 'Organizador',
          });
          if (taskRes.success) {
            result.response += `\n\n✅ **¡Tarea creada al toque!** 📝\n• **Tarea**: ${data.texto}\n• **Asignado**: ${data.asignadaA || 'Organizador'}`;
          } else {
            result.response += `\n\n❌ **No pude guardar la tarea**: ${taskRes.error || 'error desconocido'}`;
          }
        } else {
          result.response += `\n\n⚠️ **Che, para crear una tarea primero tenés que estar dentro de una fiesta específica.** Pero te puedo crear un recordatorio general si querés, pedímelo. 😉`;
        }
      } else if (action.type === 'complete_task') {
        const data = action.data as any;
        const targetFiestaId = data.fiestaId || input.fiestaId;
        if (targetFiestaId) {
          const { getFiestaById } = await import('@/app/actions/fiesta/fiesta.actions');
          const { updateTareas } = await import('@/app/actions/fiesta/tareas.actions');
          const { LECTURA_COMPLETA } = await import('@/lib/fiesta/lectura-completa');
          const fiesta = await getFiestaById(targetFiestaId, LECTURA_COMPLETA);
          if (!fiesta) {
            result.response += `\n\n❌ **No encontré la fiesta indicada** para marcar la tarea.`;
          } else {
            const tareasActuales = fiesta.tareas || [];
            let encontrada = false;
            let tareaCompletadaTexto = '';
            const nuevasTareas = tareasActuales.map((t) => {
              const coincideId = data.tareaId && t.id === data.tareaId;
              const coincideTexto = data.texto && t.texto.toLowerCase().includes(data.texto.toLowerCase());
              if ((coincideId || coincideTexto) && !encontrada) {
                encontrada = true;
                tareaCompletadaTexto = t.texto;
                return { ...t, completada: true };
              }
              return t;
            });

            // Si la IA no dijo cuál tarea, no se adivina: marcar la primera de la lista daría por
            // hecha una tarea que nadie hizo.
            if (encontrada) {
              const updateRes = await updateTareas(targetFiestaId, nuevasTareas);
              if (updateRes.success) {
                result.response += `\n\n✅ **¡Tarea completada!** ✔️\n• **Tarea**: ${tareaCompletadaTexto || data.texto || 'Tarea'}\n• **Estado**: Hecha`;
              } else {
                result.response += `\n\n❌ **No pude actualizar las tareas**: ${updateRes.error || 'error desconocido'}`;
              }
            } else {
              result.response += `\n\n⚠️ **No encontré la tarea** "${data.texto || data.tareaId || ''}" en la fiesta.`;
            }
          }
        } else {
          result.response += `\n\n⚠️ **Para marcar una tarea como hecha tenés que estar dentro de una fiesta específica.**`;
        }
      } else if (action.type === 'add_guest') {
        const data = action.data as any;
        const targetFiestaId = data.fiestaId || input.fiestaId;
        if (targetFiestaId) {
          const { addInvitado } = await import('@/app/actions/fiesta/invitados.actions');
          const guestRes = await addInvitado(targetFiestaId, {
            nombre: data.nombre || data.name || 'Invitado nuevo',
            categoria: data.categoria || data.tipo || 'Adulto',
            rsvp: data.rsvp || 'Confirmado',
            partySize: typeof data.partySize === 'number' ? data.partySize : 1,
            tableNumber: data.mesa || data.tableNumber,
            notes: data.notes || data.notas,
            dietaryRestriction: data.menu || data.dietaryRestriction || 'Ninguna',
          } as any);
          if (guestRes.success) {
            result.response += `\n\n🎟️ **Invitado anotado con éxito**\n• **Nombre**: ${data.nombre || data.name || 'Invitado nuevo'}`;
          } else {
            result.response += `\n\n❌ **No pude agregar el invitado**: ${guestRes.error || 'error desconocido'}`;
          }
        } else {
          result.response += `\n\n⚠️ **Para anotar un invitado tenés que estar dentro de una fiesta específica.**`;
        }
      } else if (action.type === 'create_incident') {
        const data = action.data as any;
        const targetFiestaId = data.fiestaId || input.fiestaId;
        if (targetFiestaId) {
          const { createIncidente } = await import('@/app/actions/incidents');
          let prioridad = 'Media';
          if (data.gravedad === 'critica' || data.prioridad === 'Critica') prioridad = 'Critica';
          else if (data.gravedad === 'alta' || data.prioridad === 'Alta') prioridad = 'Alta';
          else if (data.gravedad === 'baja' || data.prioridad === 'Baja') prioridad = 'Baja';

          const incRes = await createIncidente({
            fiestaId: targetFiestaId,
            titulo: data.titulo || data.title || 'Incidente en fiesta',
            descripcion: data.descripcion || data.description || '',
            categoria: data.categoria || 'Otro',
            prioridad: prioridad as any,
            estado: data.estado || 'Abierto',
            responsable: data.responsable || 'Equipo',
            planAccion: data.planAccion || '',
            seguimiento: data.seguimiento || '',
            registradoPor: data.registradoPor || 'Secretario',
          });
          if (incRes.success) {
            result.response += `\n\n⚠️ **Incidente registrado en la fiesta**\n• **Título**: ${data.titulo || data.title || 'Incidente en fiesta'}\n• **Prioridad**: ${prioridad}`;
          } else {
            result.response += `\n\n❌ **No pude registrar el incidente**: ${incRes.error || 'error desconocido'}`;
          }
        } else {
          result.response += `\n\n⚠️ **Para registrar un incidente tenés que estar dentro de una fiesta específica.**`;
        }
      } else if (action.type === 'create_lead') {
        // Antes esto NO LO EJECUTABA NADIE: la inteligencia artificial contestaba como si
        // hubiera anotado al prospecto y el prospecto no existia en ningun lado. Lo mismo
        // pasaba con el presupuesto y el mensaje de WhatsApp (mas abajo).
        const data = action.data as any;
        const { addCrmLead } = await import('@/app/actions/crm');
        const notas = [data.notes, data.nextAction ? `Proximo paso: ${data.nextAction}` : '']
          .filter(Boolean)
          .join(' · ');
        const leadRes = await addCrmLead({
          name: data.name || '',
          phone: data.phone,
          email: data.email,
          partyType: data.partyType,
          guestCount: typeof data.guestCount === 'number' ? data.guestCount : undefined,
          followUpDate: data.eventDate,
          notes: notas || undefined,
        } as any);
        if (leadRes.success) {
          result.response += `\n\n🙋 **Prospecto anotado**\n• **Nombre**: ${leadRes.lead?.name || data.name}` +
            (data.partyType ? `\n• **Fiesta**: ${data.partyType}` : '') +
            (data.eventDate ? `\n• **Fecha estimada**: ${data.eventDate}` : '');
        } else if (leadRes.duplicate) {
          result.response += `\n\n⚠️ **Ese prospecto ya estaba anotado** como "${leadRes.duplicate.name}". No lo dupliqué.`;
        } else {
          result.response += `\n\n❌ **No pude anotar el prospecto**: ${leadRes.error || 'error desconocido'}`;
        }
      } else if (action.type === 'draft_budget') {
        // Un presupuesto lo cierra una persona, no la inteligencia artificial. Lo que SI se
        // puede es no mentir: se dice que quedó tomado el pedido y dónde seguir.
        const data = action.data as any;
        result.response += `\n\n📋 **Tomé los datos para el presupuesto**` +
          (data?.clientName ? `\n• **Cliente**: ${data.clientName}` : '') +
          (data?.guestCount ? `\n• **Invitados**: ${data.guestCount}` : '') +
          `\n\n**El presupuesto lo armás vos** en "Presupuestos → Nuevo": yo no lo cierro ni le pongo precio.`;
      } else if (action.type === 'prepare_whatsapp') {
        const data = action.data as any;
        result.response += `\n\n💬 **El mensaje quedó escrito acá arriba, listo para copiar.**` +
          (data?.recipientName ? ` Es para ${data.recipientName}.` : '') +
          `\n**No lo mando yo**: lo mandás vos desde tu WhatsApp.`;
      } else if (action.type === 'create_reminder') {
        const data = action.data as any;
        const reminderRes = await crearRecordatorioDesdeMultiagente({
          titulo: data.titulo || 'Recordatorio Multiagente',
          mensaje: data.mensaje || 'Aviso importante',
          fiestaId: input.fiestaId,
          tipo: data.tipo || 'aviso',
        });
        if (reminderRes.success) {
          result.response += `\n\n🔔 **¡Recordatorio agendado!** 📅\n• **Aviso**: ${data.mensaje}`;
        } else {
          result.response += `\n\n❌ **No pude agendar el recordatorio**: ${reminderRes.error || 'error desconocido'}`;
        }
      }
    } catch (err: any) {
      console.error('[Multiagent Actions] Error al ejecutar acción real:', err);
      result.response += `\n\n❌ **Hubo un problema al procesar el pedido**: ${err.message || 'error desconocido'}`;
    }
  }

  let sessionId = input.sessionId;
  let savedChat = false;

  try {
    const session = await appendMultiAgentChatTurn({
      sessionId: input.sessionId,
      agentType: result.agentType,
      agentName: result.agentName,
      pathname: input.pathname,
      fiestaId: input.fiestaId,
      userMessage: input.message,
      assistantMessage: result.response,
    });
    sessionId = session.id;
    savedChat = true;
  } catch {
    savedChat = false;
  }

  try {
    const memoryScope = input.fiestaId
      ? 'fiesta'
      : result.agentType === 'secretaria' || result.agentType === 'central'
        ? 'global'
        : 'modulo';
    const memoryModule = memoryScope === 'modulo' ? result.agentType : undefined;

    await saveAgentLearning({
      agentType: result.agentType,
      fiestaId: input.fiestaId,
      scope: memoryScope,
      module: memoryModule,
      title: `Chat guardado: ${input.message.slice(0, 70)}`,
      content: buildConversationLearning({ message: input.message, response: result.response, pathname: input.pathname }),
      tags: ['chat', 'widget', input.pathname || 'sin-ruta'],
      source: 'conversation',
      confidence: 'medium',
    });

    if (result.agentType === 'fiesta' && input.fiestaId) {
      await saveAgentLearning({
        agentType: 'fiestas_general',
        module: 'fiestas_general',
        title: `Aprendizaje desde fiesta ${input.fiestaId}`,
        content: buildConversationLearning({ message: input.message, response: result.response, pathname: input.pathname }).slice(0, 1200),
        tags: ['retroalimentacion', 'chat-fiesta'],
        source: 'conversation',
        confidence: 'medium',
      });
    }
  } catch {
    // La respuesta no debe fallar si la memoria no pudo persistirse.
  }

  return { ...result, sessionId, savedChat };
}

export async function getChatsMultiagente(input?: {
  agentType?: AkAgentType;
  fiestaId?: string;
  limit?: number;
}): Promise<AkAgentChatSession[]> {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  return listMultiAgentChatSessions(input);
}

export async function guardarAprendizajeAgente(input: {
  agentType: AkAgentType;
  title: string;
  content: string;
  fiestaId?: string;
  module?: string;
  tags?: string[];
}) {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  return saveAgentLearning({
    agentType: input.agentType,
    title: input.title,
    content: input.content,
    fiestaId: input.fiestaId,
    module: input.module,
    tags: input.tags,
    source: 'manual',
    confidence: 'high',
  });
}

export async function getMemoriasMultiagente() {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  return listAgentMemoryProfiles();
}

export async function getMultiAgentTeamBriefing() {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  const briefing = await buildMultiAgentTeamBriefing();
  return { success: true, data: briefing };
}

async function persistAgentLearning(input: Parameters<typeof saveAgentLearning>[0]) {
  try {
    await saveAgentLearning(input);
    return true;
  } catch {
    return false;
  }
}

export async function runMultiAgentTeamReview() {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  const briefing = await buildMultiAgentTeamBriefing();
  const agentsToPersist: AkAgentType[] = ['secretaria', 'fiestas_general', 'contable', 'marketing', 'comercial'];
  let saved = 0;
  let failed = 0;

  for (const agentType of agentsToPersist) {
    const items = briefing.byAgent[agentType] || [];
    if (items.length === 0) continue;
    const persisted = await persistAgentLearning({
      agentType,
      module: agentType,
      title: 'Revisión automática del equipo AK',
      content: summarizeDiagnosticsForLearning(agentType, items),
      tags: ['revision-equipo', 'diagnostico', 'multiagente'],
      source: 'system',
      confidence: 'high',
    });
    if (persisted) saved++;
    else failed++;
  }

  const fiestaItems = briefing.items.filter(item => item.agentType === 'fiesta' && item.fiestaId);
  const fiestaIds = Array.from(new Set(fiestaItems.map(item => item.fiestaId).filter(Boolean))) as string[];
  for (const fiestaId of fiestaIds.slice(0, 20)) {
    const items = fiestaItems.filter(item => item.fiestaId === fiestaId);
    const persisted = await persistAgentLearning({
      agentType: 'fiesta',
      fiestaId,
      title: 'Revisión automática de esta fiesta',
      content: summarizeDiagnosticsForLearning('fiesta', items),
      tags: ['revision-fiesta', 'diagnostico', 'multiagente'],
      source: 'system',
      confidence: 'high',
    });
    if (persisted) saved++;
    else failed++;
  }

  // no-mira-el-resultado: aviso secundario al panel del equipo; la revision ya quedo guardada
  await createNotification({
    titulo: 'Revisión del equipo multiagente lista',
    mensaje: briefing.summary,
    tipo: briefing.items.some(item => item.priority === 'alta') ? 'urgente' : 'aviso',
    href: '/multiagente/equipo',
    icono: 'Brain',
    rolDestino: 'admin',
  }).catch(() => null);

  return { success: true, briefing, saved, failed };
}

export async function crearTareaDesdeMultiagente(input: {
  fiestaId: string;
  texto: string;
  descripcion?: string;
  fechaLimite?: string;
  asignadaA?: 'Cliente' | 'Organizador';
}) {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  const fiesta = await getFiestaById(input.fiestaId);
  if (!fiesta) return { success: false, error: 'No encontré la fiesta.' };

  const tarea: Tarea = {
    id: `multiagent_task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    texto: input.texto.trim(),
    descripcion: input.descripcion?.trim(),
    completada: false,
    fechaLimite: input.fechaLimite || undefined,
    asignadaA: input.asignadaA ?? 'Organizador',
    esPredeterminada: false,
  };

  if (!tarea.texto) return { success: false, error: 'La tarea necesita texto.' };

  const updatedFiesta = {
    ...fiesta,
    tareas: [...(fiesta.tareas || []), tarea],
  };

  const result = await saveFiesta(updatedFiesta);
  if (!result.success) return { success: false, error: result.error || 'No se pudo guardar la tarea.' };

  // no-mira-el-resultado: aviso secundario al panel del equipo; la tarea ya quedo guardada
  await createNotification({
    titulo: 'Tarea creada por Multiagente AK',
    mensaje: `Nueva tarea: ${tarea.texto}`,
    tipo: 'aviso',
    href: `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`,
    icono: 'ListChecks',
    entidadRelacionadaId: fiesta.id,
    rolDestino: 'admin',
  }).catch(() => null);

  await saveAgentLearning({
    agentType: 'fiesta',
    fiestaId: fiesta.id,
    title: 'Tarea creada desde el Multiagente',
    content: tarea.texto,
    tags: ['tarea', 'accion-real'],
    source: 'system',
    confidence: 'high',
  }).catch(() => null);

  return { success: true, tarea, fiesta: updatedFiesta };
}

export async function crearRecordatorioDesdeMultiagente(input: {
  titulo: string;
  mensaje: string;
  href?: string;
  fiestaId?: string;
  tipo?: 'info' | 'aviso' | 'urgente' | 'exito';
}) {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  if (!input.mensaje.trim()) return { success: false, error: 'El recordatorio necesita mensaje.' };

  const result = await createNotification({
    titulo: input.titulo || 'Recordatorio Multiagente AK',
    mensaje: input.mensaje,
    tipo: input.tipo ?? 'aviso',
    href: input.href || (input.fiestaId ? `/fiestas/nueva?fiestaId=${input.fiestaId}` : '/secretaria-ak'),
    icono: 'BellRing',
    entidadRelacionadaId: input.fiestaId,
    rolDestino: 'admin',
  });

  if (!result.success) return { success: false, error: result.error || 'No se pudo crear el recordatorio.' };

  await saveAgentLearning({
    agentType: 'secretaria',
    title: input.titulo || 'Recordatorio creado',
    content: input.mensaje,
    tags: ['recordatorio', 'accion-real'],
    source: 'system',
    confidence: 'high',
  }).catch(() => null);

  return { success: true, notification: result.notification };
}

export async function enviarAprendizajeAFiestasGeneral(input: {
  fiestaId?: string;
  title: string;
  content: string;
}) {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { success: false, error: 'Falta título o contenido.' };

  if (input.fiestaId) {
    await saveAgentLearning({
      agentType: 'fiesta',
      fiestaId: input.fiestaId,
      title,
      content,
      tags: ['aprendizaje-fiesta'],
      source: 'manual',
      confidence: 'high',
    });
  }

  const general = await saveAgentLearning({
    agentType: 'fiestas_general',
    module: 'fiestas_general',
    title,
    content,
    tags: ['retroalimentacion', 'fiesta'],
    source: 'event_closeout',
    confidence: 'high',
  });

  return { success: true, profile: general };
}

export async function cerrarFiestaConRetroalimentacion(input: {
  fiestaId: string;
  notasFinales?: string;
}) {
  // Las pantallas de multiagente son del equipo y estan detras del ingreso, pero la
  // funcion en si estaba abierta: se podia llamar desde afuera sin cuenta.
  await requireAppSession();
  const fiesta = await getFiestaById(input.fiestaId);
  if (!fiesta) return { success: false, error: 'No encontré la fiesta.' };

  const nombre = fiesta.configuracion?.nombreEvento || fiesta.id;
  const pendientes = (fiesta.tareas || []).filter(t => !t.completada).map(t => t.texto).slice(0, 10);
  const completadas = (fiesta.tareas || []).filter(t => t.completada).length;
  const totalTareas = (fiesta.tareas || []).length;

  const resumen = [
    `Fiesta: ${nombre}`,
    `Fecha: ${fiesta.configuracion?.fechaEvento || 'sin fecha'}`,
    `Invitados estimados: ${fiesta.configuracion?.invitadosEstimados || 0}`,
    `Tareas completadas: ${completadas}/${totalTareas}`,
    pendientes.length ? `Pendientes al cierre: ${pendientes.join('; ')}` : 'Sin pendientes visibles al cierre.',
    input.notasFinales ? `Notas finales: ${input.notasFinales}` : '',
  ].filter(Boolean).join('\n');

  await saveAgentLearning({
    agentType: 'fiesta',
    fiestaId: fiesta.id,
    title: `Resumen final de ${nombre}`,
    content: resumen,
    tags: ['cierre-fiesta', 'resumen-final'],
    source: 'event_closeout',
    confidence: 'high',
  });

  await saveAgentLearning({
    agentType: 'fiestas_general',
    module: 'fiestas_general',
    title: `Aprendizaje recibido desde ${nombre}`,
    content: resumen,
    tags: ['retroalimentacion', 'cierre-fiesta'],
    source: 'event_closeout',
    confidence: 'high',
  });

  // no-mira-el-resultado: aviso secundario al panel del equipo; el resumen y aprendizaje ya quedaron guardados
  await createNotification({
    titulo: 'Fiesta cerrada con aprendizaje',
    mensaje: `Se guardó el resumen final de ${nombre} y se envió al agente general de fiestas.`,
    tipo: 'exito',
    href: '/multiagente/memoria',
    icono: 'Brain',
    entidadRelacionadaId: fiesta.id,
    rolDestino: 'admin',
  }).catch(() => null);

  return { success: true, resumen };
}
