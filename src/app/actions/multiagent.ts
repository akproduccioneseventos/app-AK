'use server';

import { runMultiAgent } from '@/ai/flows/multiagent-flow';
import { saveAgentLearning, listAgentMemoryProfiles } from '@/lib/multiagent/memory-store';
import { buildMultiAgentTeamBriefing, summarizeDiagnosticsForLearning } from '@/lib/multiagent/diagnostics';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from '@/app/actions/notifications';
import type { Tarea } from '@/types/fiesta';
import type { AkAgentType, AkMultiAgentMessage, AkMultiAgentOutput } from '@/types/multiagent';

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
  try {
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

export async function guardarAprendizajeAgente(input: {
  agentType: AkAgentType;
  title: string;
  content: string;
  fiestaId?: string;
  module?: string;
  tags?: string[];
}) {
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
  return listAgentMemoryProfiles();
}

export async function getMultiAgentTeamBriefing() {
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
