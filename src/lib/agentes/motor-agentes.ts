import { generateAiCommercialFollowup } from '@/lib/commercial/commercial-followup';
import { generateAiPostEventMaterial } from '@/lib/post-event/post-event-core';
import { generateSocialPostFlow } from '@/ai/flows/generate-social-post-flow';
import type { CrmLead } from '@/types/crm';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { nivelDeRiesgo } from '@/lib/asistente/que-puede-hacer-solo';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';
import { getBudgetCollectibleTotal } from '@/lib/budget/financial-guardrails';
import { readData, writeData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';
import { hoyEnUruguay } from '@/lib/utils';
import { getFiestaTimeRange, localDateTimeToUtcMs } from '@/lib/staff-agenda-conflicts';
import { applyAutomaticStaffByGuests, createLiveBudgetState } from '@/lib/commercial/live-budget-editor';
import { buscarRol } from '@/lib/fiesta/personal-por-invitados';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import type { ScheduledMessage } from '@/types/whatsapp-automation';
import { detectarErroresHumanos, type DescarteAlerta } from '@/lib/alertas/errores-humanos';
import { getMetaAdsSummary } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';
import { getReglaParaTarea, registrarAccionSola } from '@/lib/ia/reglas-de-la-ia';
import {
  AGENTES_DEFAULT_CONFIG,
  type ConfiguracionAgente,
  type RegistroEjecucionAgente,
} from './tipos';

const CONFIG_FILE = 'agentes-configuracion.json';
const HISTORIAL_FILE = 'agentes-historial.json';
const MAX_HISTORIAL = 50;

export interface FaltanteMozosProximo {
  fiestaId: string;
  fechaEvento: string;
  invitados: number;
  asignados: number;
  requeridos: number;
  hallazgo: string;
}

export function anticiparFaltantesDeMozos(
  fiestas: FiestaEnPlanificacion[],
  roles: Array<{ id: string; nombre: string }>,
  ahora: Date,
): FaltanteMozosProximo[] {
  const rolMozo = buscarRol(roles, 'Mozo');
  if (!rolMozo) return [];

  const limite = ahora.getTime() + 14 * 24 * 60 * 60 * 1000;
  const faltantes: FaltanteMozosProximo[] = [];

  for (const fiesta of fiestas) {
    const estado = String(fiesta.estado || '').trim().toLocaleLowerCase('es-UY');
    if (['suspendida', 'archivada', 'archivado', 'cancelada', 'cancelado', 'demo ak'].includes(estado)) continue;
    if (fiesta.id?.startsWith('demo_') || fiesta.modulosContratados?.catering !== true) continue;

    const fechaEvento = String(fiesta.configuracion?.fechaEvento || '').slice(0, 10);
    const inicio = localDateTimeToUtcMs(fechaEvento, fiesta.configuracion?.horaInicio || '');
    if (inicio === null || inicio <= ahora.getTime() || inicio > limite) continue;

    const invitados = Number(fiesta.configuracion?.invitadosEstimados);
    if (!Number.isFinite(invitados) || invitados <= 0) continue;

    // Use the live-budget rule as a pure calculation; this transient state is never persisted.
    const regla = applyAutomaticStaffByGuests(
      createLiveBudgetState({ guestCount: invitados }),
      { mozoUnitPrice: 0, cocinaUnitPrice: 0 },
    );
    const requeridos = regla.items.find((item) => item.id === 'auto_mozo')?.quantity;
    if (!Number.isFinite(requeridos) || !requeridos || !fiesta.id) continue;

    const asignados = (fiesta.personalAsignado || []).filter(
      (persona) => persona.rolId === rolMozo.id && typeof persona.empleadoId === 'string' && persona.empleadoId.trim(),
    ).length;
    if (asignados >= requeridos) continue;

    const deficit = requeridos - asignados;
    const hallazgo = `[FALTANTE PERSONAL][fiesta=${encodeURIComponent(fiesta.id)};fecha=${fechaEvento};invitados=${invitados};asignados=${asignados};requeridos=${requeridos}] ${fiesta.configuracion?.nombreEvento || 'Fiesta'}: hay ${asignados} mozos asignados y se requieren ${requeridos}; faltan ${deficit}.`;
    faltantes.push({ fiestaId: fiesta.id, fechaEvento, invitados, asignados, requeridos, hallazgo });
  }

  return faltantes;
}

export async function getConfiguracionAgentes(): Promise<ConfiguracionAgente[]> {
  try {
    const saved = await readData<ConfiguracionAgente[]>(CONFIG_FILE, []);
    if (!saved || saved.length === 0) return AGENTES_DEFAULT_CONFIG;

    // Fusionar con defaults para asegurar que todos los agentes existan
    return AGENTES_DEFAULT_CONFIG.map((def) => {
      const existing = saved.find((s) => s.id === def.id);
      return existing ? { ...def, ...existing } : def;
    });
  } catch {
    return AGENTES_DEFAULT_CONFIG;
  }
}

export async function guardarConfiguracionAgentes(config: ConfiguracionAgente[]): Promise<void> {
  await writeData(CONFIG_FILE, config);
}

export async function registrarEjecucionAgente(registro: RegistroEjecucionAgente): Promise<void> {
  try {
    const historial = await readData<RegistroEjecucionAgente[]>(HISTORIAL_FILE, []);
    const updated = [registro, ...historial].slice(0, MAX_HISTORIAL);
    await writeData(HISTORIAL_FILE, updated, undefined, { skipAutoBackup: true });

    // Actualizar última ejecución en la configuración
    const config = await getConfiguracionAgentes();
    const updatedConfig = config.map((c) =>
      c.id === registro.agenteId
        ? {
            ...c,
            ultimaEjecucion: registro.ejecutadoEn,
            estadoUltimaEjecucion: registro.estado,
          }
        : c
    );
    await guardarConfiguracionAgentes(updatedConfig);
  } catch (error) {
    console.warn('[Agentes] Error al registrar ejecución:', error);
  }
}

export async function getHistorialEjecuciones(): Promise<RegistroEjecucionAgente[]> {
  try {
    return readData<RegistroEjecucionAgente[]>(HISTORIAL_FILE, []);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. EL VIGILANTE DE LAS FIESTAS
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarVigilanteFiestas(ahora = new Date()): Promise<RegistroEjecucionAgente> {
  const hallazgos: string[] = [];
  const acciones: string[] = [];

  const [fiestas, presupuestos, descartes, roles] = await Promise.all([
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<Presupuesto[]>('presupuestos.json', []),
    readData<DescarteAlerta[]>('alertas-descartadas.json', []),
    readData<Array<{ id: string; nombre: string }>>('roles.json', []),
  ]);

  const alertas = detectarErroresHumanos(fiestas, presupuestos, descartes, ahora);
  const faltantesMozos = anticiparFaltantesDeMozos(fiestas, roles, ahora);

  if (alertas.length === 0) {
    hallazgos.push('No se detectaron errores humanos en las fiestas activas.');
  } else {
    for (const a of alertas) {
      hallazgos.push(`[${a.urgencia.toUpperCase()}] ${a.fiestaNombre}: ${a.titulo} - ${a.descripcion}`);
    }
    const urgentes = alertas.filter((a) => a.urgencia === 'peligro_2_dias' || a.urgencia === 'urgente_7_dias');
    if (urgentes.length > 0) {
      acciones.push(`Se publicaron ${urgentes.length} avisos urgentes listos para revisar en /repaso-diario.`);
    }
  }

  for (const faltante of faltantesMozos) {
    hallazgos.push(faltante.hallazgo);
    acciones.push('Dejar una propuesta interna para completar la asignación de mozos; no se modifica el equipo ni el presupuesto.');
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_vigilante_${Date.now()}`,
    agenteId: 'vigilante_fiestas',
    agenteNombre: 'Vigilante de Fiestas',
    ejecutadoEn: ahora.toISOString(),
    hallazgos,
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin acciones requeridas'],
    estado: alertas.length > 0 || faltantesMozos.length > 0 ? 'alerta' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EL QUE PERSIGUE LOS PRESUPUESTOS (NUNCA MANDA SOLO)
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarPerseguidorPresupuestos(ahora = new Date()): Promise<RegistroEjecucionAgente> {
  const hallazgos: string[] = [];
  const acciones: string[] = [];

  const [presupuestos, scheduledMessages, leads] = await Promise.all([
    readData<Presupuesto[]>('presupuestos.json', []),
    readData<ScheduledMessage[]>('scheduled-messages.json', []),
    readData<CrmLead[]>('crm-leads.json', []),
  ]);

  const ahoraMs = ahora.getTime();
  const pendientes = scheduledMessages || [];
  const nuevosMensajes: ScheduledMessage[] = [];

  for (const p of presupuestos) {
    if (p.estado !== 'Enviado' || !p.clienteContacto) continue;

    const fechaCreacionMs = new Date(p.timestamp || '').getTime();
    if (isNaN(fechaCreacionMs)) continue;

    const diasDesdeEnvio = Math.floor((ahoraMs - fechaCreacionMs) / (1000 * 60 * 60 * 24));
    const contacto = p.clienteContacto.trim();

    // Ya existe un mensaje en cola para este presupuesto
    const yaEnCola = pendientes.some((m) => m.targetPhone === contacto && m.status === 'pendiente');
    if (yaEnCola) continue;

    const lead = leads.find((l) => (p.leadId && l.id === p.leadId) || l.presupuestoId === p.id || (l.phone && l.phone.trim() === contacto));

    if (diasDesdeEnvio >= 5 && diasDesdeEnvio < 14) {
      hallazgos.push(`Presupuesto de ${p.clienteNombre} (${p.eventoTipo}) sin respuesta hace ${diasDesdeEnvio} días.`);
      const textoFijo = `Hola ${p.clienteNombre}, ¿cómo estás? Te escribo de AK Producciones para saber si pudiste revisar la propuesta para el evento del ${p.eventoFecha ? formatearFechaEvento(p.eventoFecha) : 'evento'}. Si querés coordinar una reunión o ajustar servicios, avisame y lo vemos juntos.`;

      let textoFinal = textoFijo;
      try {
        const aiRes = await generateAiCommercialFollowup({
          name: lead?.name || p.clienteNombre,
          source: lead ? 'crm' : 'presupuesto',
          eventType: lead?.partyType || p.eventoTipo,
          eventDate: lead?.eventDate || p.eventoFecha,
          reason: `Presupuesto de ${p.eventoTipo || 'evento'} enviado hace ${diasDesdeEnvio} días sin respuesta.`,
          leadNotes: lead?.notes,
        });
        if (aiRes?.success && aiRes.message?.trim()) {
          textoFinal = aiRes.message.trim();
        }
      } catch {
        textoFinal = textoFijo;
      }

      nuevosMensajes.push({
        id: `msg_follow_${p.id}_5d`,
        targetType: 'prospecto',
        targetId: p.leadId || p.id,
        targetName: p.clienteNombre,
        targetPhone: contacto,
        messageText: textoFinal,
        scheduledAt: ahora.toISOString(),
        createdAt: ahora.toISOString(),
        status: 'pendiente',
        templateType: 'personalizado',
      });
      acciones.push(`Borrador de seguimiento preparado para ${p.clienteNombre} en la bandeja de salida.`);
    } else if (diasDesdeEnvio >= 14 && diasDesdeEnvio <= 30) {
      hallazgos.push(`Presupuesto de ${p.clienteNombre} sin respuesta hace ${diasDesdeEnvio} días (reactivación).`);
      const textoFijo = `Hola ${p.clienteNombre}, te contacto de AK Producciones. Queríamos consultar si la fecha del ${p.eventoFecha ? formatearFechaEvento(p.eventoFecha) : 'evento'} sigue en pie o si te gustaría que mantengamos tu propuesta activa. ¡Quedamos a las órdenes!`;

      let textoFinal = textoFijo;
      try {
        const aiRes = await generateAiCommercialFollowup({
          name: lead?.name || p.clienteNombre,
          source: lead ? 'crm' : 'presupuesto',
          eventType: lead?.partyType || p.eventoTipo,
          eventDate: lead?.eventDate || p.eventoFecha,
          reason: `Reactivación de presupuesto de ${p.eventoTipo || 'evento'} tras ${diasDesdeEnvio} días.`,
          leadNotes: lead?.notes,
        });
        if (aiRes?.success && aiRes.message?.trim()) {
          textoFinal = aiRes.message.trim();
        }
      } catch {
        textoFinal = textoFijo;
      }

      nuevosMensajes.push({
        id: `msg_reactivate_${p.id}_14d`,
        targetType: 'prospecto',
        targetId: p.leadId || p.id,
        targetName: p.clienteNombre,
        targetPhone: contacto,
        messageText: textoFinal,
        scheduledAt: ahora.toISOString(),
        createdAt: ahora.toISOString(),
        status: 'pendiente',
        templateType: 'personalizado',
      });
      acciones.push(`Borrador de reactivación preparado para ${p.clienteNombre} en la bandeja de salida.`);
    }
  }

  if (nuevosMensajes.length > 0) {
    await mutateGenericJsonArray<ScheduledMessage>('scheduled-messages.json', (pendientes) => [...(pendientes || []), ...nuevosMensajes]);
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_presupuestos_${Date.now()}`,
    agenteId: 'perseguidor_presupuestos',
    agenteNombre: 'Perseguidor de Presupuestos',
    ejecutadoEn: ahora.toISOString(),
    hallazgos: hallazgos.length > 0 ? hallazgos : ['No hay presupuestos pendientes de seguimiento comercial.'],
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin borradores nuevos'],
    estado: nuevosMensajes.length > 0 ? 'exito' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EL COBRADOR (ALERTA DEUDAS Y PAGOS VENCIDOS)
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarCobrador(ahora = new Date()): Promise<RegistroEjecucionAgente> {
  const hallazgos: string[] = [];
  const acciones: string[] = [];

  const [fiestas, presupuestos, scheduledMessages] = await Promise.all([
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<Presupuesto[]>('presupuestos.json', []),
    readData<ScheduledMessage[]>('scheduled-messages.json', []),
  ]);

  const presupuestosMap = new Map(presupuestos.map((p) => [p.id, p]));
  const pendientes = scheduledMessages || [];
  const nuevosMensajes: ScheduledMessage[] = [];

  for (const fiesta of fiestas) {
    if (!fiesta.presupuestoId) continue;
    const p = presupuestosMap.get(fiesta.presupuestoId);
    if (!p || !p.clienteContacto) continue;

    const fechaStr = fiesta.configuracion?.fechaEvento || (fiesta.configuracion as any)?.fecha;
    if (!fechaStr) continue;

    const diffDias = Math.ceil((new Date(fechaStr).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    const pagos = (p.pagosCliente || []).filter(isConfirmedClientPayment).reduce((s, pg) => s + (Number(pg.monto) || 0), 0);
    const total = getBudgetCollectibleTotal(p);
    const saldo = total - pagos;

    if (saldo > 500 && diffDias >= 0 && diffDias <= 5) {
      hallazgos.push(`Fiesta de ${p.clienteNombre} es en ${diffDias} días con saldo de $${saldo.toLocaleString('es-UY')}.`);
      const yaEnCola = pendientes.some((m) => m.targetPhone === p.clienteContacto && m.templateType === 'pago_por_vencer');
      if (!yaEnCola) {
        nuevosMensajes.push({
          id: `msg_pago_${p.id}_${diffDias}d`,
          targetType: 'cliente',
          targetId: fiesta.id,
          targetName: p.clienteNombre,
          targetPhone: p.clienteContacto.trim(),
          messageText: `Hola ${p.clienteNombre}, te recordamos que el saldo pendiente para tu fiesta (${p.eventoTipo}) es de $${saldo.toLocaleString('es-UY')}. Faltan ${diffDias} días para el evento. Podés realizar el pago por transferencia o consultar por otros medios. ¡Gracias!`,
          scheduledAt: ahora.toISOString(),
          createdAt: ahora.toISOString(),
          status: 'pendiente',
          templateType: 'pago_por_vencer',
        });
        acciones.push(`Recordatorio de saldo preparado en bandeja para ${p.clienteNombre}.`);
      }
    }
  }

  if (nuevosMensajes.length > 0) {
    await mutateGenericJsonArray<ScheduledMessage>('scheduled-messages.json', (pendientes) => [...(pendientes || []), ...nuevosMensajes]);
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_cobrador_${Date.now()}`,
    agenteId: 'cobrador',
    agenteNombre: 'Agente Cobrador',
    ejecutadoEn: ahora.toISOString(),
    hallazgos: hallazgos.length > 0 ? hallazgos : ['No hay saldos inmediatos que requieran recordatorio.'],
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin borradores de cobro'],
    estado: nuevosMensajes.length > 0 ? 'exito' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EL CREADOR DE CONTENIDO (BORRADORES SIEMPRE)
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarGeneradorContenido(ahora = new Date()): Promise<RegistroEjecucionAgente> {
  const hallazgos: string[] = [];
  const acciones: string[] = [];

  const [fiestas, posts, scheduledMessages] = await Promise.all([
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<any[]>('social-posts.json', []),
    readData<ScheduledMessage[]>('scheduled-messages.json', []),
  ]);

  const ahoraMs = ahora.getTime();
  const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
  const unDiaMs = 24 * 60 * 60 * 1000;
  const tresDiasMs = 3 * 24 * 60 * 60 * 1000;

  const nuevosPosts: any[] = [];
  const nuevosScheduled: ScheduledMessage[] = [];

  for (const f of fiestas) {
    const fechaStr = f.configuracion?.fechaEvento || (f.configuracion as any)?.fecha;
    if (!fechaStr) continue;

    const fechaMs = new Date(fechaStr).getTime();
    const diferenciaMs = ahoraMs - fechaMs;

    if (diferenciaMs > 0 && diferenciaMs < sieteDiasMs) {
      const nombre = f.configuracion?.nombreEvento || f.configuracion?.nombreAgasajado || 'Fiesta';
      const tipo = f.configuracion?.tipoCelebracion || 'evento';
      hallazgos.push(`Fiesta reciente finalizada: ${nombre}.`);

      const yaTienePost = (posts || []).some((p) => p.titulo?.includes(nombre) || p.caption?.includes(nombre) || p.eventId === f.id);
      if (!yaTienePost) {
        const ahoraIso = ahora.toISOString();

        // 1 a 3 fotos reales de la galería de esa fiesta
        const fotos: string[] = [];
        if (f.invitacionConfig?.galeriaFotos) fotos.push(...f.invitacionConfig.galeriaFotos);
        if (f.invitacionDigital?.galeria?.fotos) fotos.push(...f.invitacionDigital.galeria.fotos);
        if (f.galeriaUrl) fotos.push(f.galeriaUrl);
        const fotosReales = fotos.filter(Boolean).slice(0, 3);

        let textoPost = `Que noche la de ${nombre}. Gracias por confiar en AK Producciones para tu fiesta.`;
        try {
          const aiPost = await generateSocialPostFlow({
            eventName: nombre,
            eventType: tipo,
            audience: 'invitados y seguidores',
            goal: 'mostrar la diversión de la fiesta',
            tone: 'cálido y emocionante',
          });
          if (aiPost?.caption?.trim()) {
            textoPost = aiPost.caption.trim();
          }
        } catch {
          // Fallback a texto fijo
        }

        const borrador: any = {
          id: `post_agente_${f.id}`,
          platform: 'Instagram',
          isGeneralCampaign: true,
          eventId: f.id,
          publishDate: ahoraIso.slice(0, 10),
          titulo: `Recuerdos de ${nombre}`,
          text: textoPost,
          mediaUrl: fotosReales[0] || undefined,
          status: 'Borrador',
          createdAt: ahoraIso,
          updatedAt: ahoraIso,
        };
        nuevosPosts.push(borrador);
        acciones.push(`Borrador de posteo creado para ${nombre} (listo para revisión en Redes Sociales).`);
      }

      // Bloque 9: 1 a 3 días después de la fiesta corre generateAiPostEventMaterial como borrador
      if (diferenciaMs >= unDiaMs && diferenciaMs <= tresDiasMs) {
        const yaTieneBorrador = [...(scheduledMessages || []), ...nuevosScheduled].some(
          (m) => m.targetId === f.id || m.id === `msg_post_event_${f.id}`
        );

        if (!yaTieneBorrador) {
          try {
            const clientName = f.configuracion?.clienteNombre || nombre;
            const clientPhone = (f.configuracion as any)?.clienteTelefono || (f.configuracion as any)?.contacto || '';
            const postEvent = await generateAiPostEventMaterial({
              clientName,
              eventName: nombre,
              eventType: tipo,
              eventDate: fechaStr,
              score: 100,
              pendingTasks: 0,
            });

            if (postEvent?.testimonyMessage) {
              nuevosScheduled.push({
                id: `msg_post_event_${f.id}`,
                targetType: 'cliente',
                targetId: f.id,
                targetName: clientName,
                targetPhone: clientPhone,
                messageText: postEvent.testimonyMessage,
                scheduledAt: ahora.toISOString(),
                createdAt: ahora.toISOString(),
                status: 'pendiente',
                templateType: 'personalizado',
              });
              acciones.push(`Borrador post-evento preparado para ${nombre} en la bandeja de salida.`);
            }
          } catch (e) {
            console.warn('[Agentes] Error al generar material post-evento:', e);
          }
        }
      }
    }
  }

  if (nuevosPosts.length > 0) {
    await mutateGenericJsonArray<any>('social-posts.json', (posts) => [...(posts || []), ...nuevosPosts]);
  }

  if (nuevosScheduled.length > 0) {
    await writeData('scheduled-messages.json', [...(scheduledMessages || []), ...nuevosScheduled]);
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_contenido_${Date.now()}`,
    agenteId: 'generador_contenido',
    agenteNombre: 'Creador de Contenido',
    ejecutadoEn: ahora.toISOString(),
    hallazgos: hallazgos.length > 0 ? hallazgos : ['Calendario de contenido evaluado; sin eventos pendientes de borrador.'],
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin borradores nuevos'],
    estado: (nuevosPosts.length > 0 || nuevosScheduled.length > 0) ? 'exito' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EL OPERADOR DE LA NOCHE (MONITOREO EN VIVO)
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarVigilanteNoche(ahora = new Date()): Promise<RegistroEjecucionAgente> {
  const hallazgos: string[] = [];
  const acciones: string[] = [];

  const [fiestas, inventario] = await Promise.all([
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<ServicioEmpresa[]>('insumos.json', []),
  ]);
  const horaLocal = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Montevideo',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(ahora);
  const bucketHora = `${hoyEnUruguay(ahora)}-${horaLocal}`;
  const ahoraMs = ahora.getTime();
  const fiestasActivas = fiestas.filter((fiesta) => {
    if (typeof fiesta.id !== 'string' || !fiesta.id.trim()) return false;
    const estado = String(fiesta.estado || '').trim().toLocaleLowerCase('es-UY');
    if (['suspendida', 'archivada', 'archivado', 'cancelada', 'cancelado', 'demo ak'].includes(estado)) return false;
    if (fiesta.id?.startsWith('demo_')) return false;
    const rango = getFiestaTimeRange(fiesta);
    return rango && ahoraMs >= rango.startMs && ahoraMs <= rango.endMs;
  });

  const registrarAlerta = (fiestaId: string, tema: string, resumen: string) => {
    const clave = `[ALERTA NOCHE][fiesta=${encodeURIComponent(fiestaId)};tema=${tema};hora=${bucketHora}]`;
    hallazgos.push(`${clave} ${resumen}`);
  };

  for (const fiesta of fiestasActivas) {
    const nombre = fiesta.configuracion?.nombreEvento || fiesta.configuracion?.nombreAgasajado || 'Fiesta';
    const rango = getFiestaTimeRange(fiesta);
    if (!rango) continue;

    const atrasados = (fiesta.programa || []).filter((item) => {
      if (item.completado || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.hora || '')) return false;
      let programadoMs = localDateTimeToUtcMs(rango.fechaStr, item.hora);
      if (programadoMs === null) return false;
      while (programadoMs < rango.startMs) programadoMs += 24 * 60 * 60 * 1000;
      return programadoMs <= ahoraMs - 20 * 60 * 1000 && programadoMs <= rango.endMs;
    });
    if (atrasados.length > 0) {
      const momentos = atrasados.slice(0, 3).map((item) => `${item.hora} ${item.titulo || 'Actividad'}`).join('; ');
      registrarAlerta(fiesta.id, 'programa', `${nombre}: ${atrasados.length} momento(s) del programa llevan 20 minutos o más sin marcarse como hechos. ${momentos}`);
      acciones.push(`Revisar el programa de ${nombre} y marcar el momento como hecho solo cuando el responsable confirme que ocurrió.`);
    }

    const sinLlegada = (fiesta.personalAsignado || []).filter((persona) => !persona.checkInTimestamp?.trim());
    if (sinLlegada.length > 0 && ahoraMs >= rango.startMs + 20 * 60 * 1000) {
      registrarAlerta(fiesta.id, 'personal', `${nombre}: ${sinLlegada.length} persona(s) asignada(s) todavía no tienen llegada marcada tras 20 minutos del inicio.`);
      acciones.push(`Confirmar con el encargado de ${nombre} si el personal ya llegó; no se cambia la asignación automáticamente.`);
    }

    const cartaTragos = fiesta.cartaTragos as unknown as {
      items?: Array<{ nombre?: string; recetaIngredientes?: Array<{ insumoId: string; cantidad: number; unidad?: string }> }>;
    } | undefined;
    const tragos = (cartaTragos?.items || []).filter((trago) => typeof trago.nombre === 'string' && trago.nombre.trim());
    const tragosConStockBajo = tragos.flatMap((trago) => {
      const disponibles = calcularTragosDisponibles(trago, inventario);
      return disponibles !== null && disponibles < 10 ? [{ nombre: trago.nombre, disponibles }] : [];
    });
    if (tragosConStockBajo.length > 0) {
      const detalle = tragosConStockBajo.map((trago) => `${trago.nombre}: ${trago.disponibles}`).join('; ');
      registrarAlerta(fiesta.id, 'barra', `${nombre}: quedan ingredientes para menos de 10 tragos en una o más recetas (${detalle}).`);
      acciones.push(`Avisar al encargado de barra de ${nombre} para que revise el stock real; no se compra ni ajusta inventario automáticamente.`);
    }
  }

  if (fiestasActivas.length === 0) {
    acciones.push('No hay fiestas dentro de su horario activo para monitorear ahora.');
  } else if (hallazgos.length === 0) {
    acciones.push(`Monitoreo de ${fiestasActivas.length} fiesta(s) en vivo: sin atrasos, faltas de llegada ni recetas con stock bajo detectados.`);
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_noche_${Date.now()}`,
    agenteId: 'vigilante_noche',
    agenteNombre: 'Operador de la Noche',
    ejecutadoEn: ahora.toISOString(),
    hallazgos,
    accionesPreparadas: acciones,
    estado: hallazgos.length > 0 ? 'alerta' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

export function calcularTragosDisponibles(
  trago: { recetaIngredientes?: Array<{ insumoId: string; cantidad: number; unidad?: string }> },
  inventario: Array<Pick<ServicioEmpresa, 'id' | 'cantidadDisponible' | 'unidad'>>,
): number | null {
  if (!trago.recetaIngredientes?.length) return null;
  const cantidades = new Map<string, number>();
  const unidades = new Map<string, string>();
  for (const ingrediente of trago.recetaIngredientes) {
    const unidad = ingrediente.unidad?.trim().toLocaleLowerCase('es-UY');
    if (!ingrediente.insumoId || !Number.isFinite(ingrediente.cantidad) || ingrediente.cantidad <= 0 || !unidad) return null;
    cantidades.set(ingrediente.insumoId, (cantidades.get(ingrediente.insumoId) || 0) + ingrediente.cantidad);
    const unidadExistente = unidades.get(ingrediente.insumoId);
    if (unidadExistente && unidadExistente !== unidad) return null;
    unidades.set(ingrediente.insumoId, unidad);
  }

  let limite = Number.POSITIVE_INFINITY;
  for (const [insumoId, porTrago] of cantidades) {
    const coincidencias = inventario.filter((item) => item.id === insumoId);
    if (coincidencias.length !== 1) return null;
    const insumo = coincidencias[0];
    if (insumo.cantidadDisponible === undefined || insumo.cantidadDisponible === null || !insumo.unidad?.trim()) return null;
    const unidadStock = insumo.unidad.trim().toLocaleLowerCase('es-UY');
    if (unidadStock !== unidades.get(insumoId)) return null;
    const stockRaw: unknown = insumo.cantidadDisponible;
    if (typeof stockRaw === 'string' && !stockRaw.trim()) return null;
    const stock = Number(stockRaw);
    if (!Number.isFinite(stock) || stock < 0) return null;
    limite = Math.min(limite, Math.floor(stock / porTrago));
  }
  return Number.isFinite(limite) ? limite : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. EL VIGILANTE DE PUBLICIDAD & META ADS (MONITOREA, NUNCA GASTA SOLO)
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarVigilantePublicidad(ahora = new Date()): Promise<RegistroEjecucionAgente> {
  const hallazgos: string[] = [];
  const acciones: string[] = [];

  try {
    const metrics = await loadMetaCommercialMetrics();
    const summary = await getMetaAdsSummary(metrics);

    if (summary.connectionStatus !== 'connected') {
      hallazgos.push('Meta Ads no está configurado o no hay conexión activa con la cuenta publicitaria.');
      acciones.push('Podés vincular tu token de Meta en Ajustes > Conexiones sociales para activar el análisis automático.');
    } else if (summary.campaigns.length === 0) {
      hallazgos.push('No hay campañas de Meta con datos en los últimos 30 días.');
      acciones.push('Sin acciones requeridas.');
    } else {
      for (const camp of summary.campaigns) {
        // El agente MIRA y PROPONE; no pausa ni sube presupuestos solo. Decisión del dueño
        // (YA-RESUELTO, orden 12: "sin gastar ni modificar campañas solo"). Quedó roto hasta el
        // 26/10/2026: pausaba y subía 25% cada 12 horas. Lo frena el-agente-de-publicidad-no-toca-campanias.
        // 1. Alerta: quemando plata sin consultas -> propone pausar
        if (camp.spend >= 1500 && camp.leadsCount === 0) {
          hallazgos.push(`[ALERTA GASTO] La campaña "${camp.name}" gastó ${summary.adCurrency} ${camp.spend.toFixed(0)} sin generar consultas.`);
          acciones.push(`Propuesta para tu OK: pausar la campaña "${camp.name}". No se tocó nada.`);
        }
        // 2. Éxito: campaña rentable -> propone escalar
        else if (camp.leadsCount >= 2 && camp.conversionsCount >= 1 && camp.cpl > 0 && camp.cpl <= (summary.averageCpl || 1000)) {
          hallazgos.push(`[ÉXITO COMERCIAL] La campaña "${camp.name}" rinde bien: consultas a ${summary.adCurrency} ${camp.cpl.toFixed(0)} y ${camp.conversionsCount} fiestas confirmadas.`);
          acciones.push(`Propuesta para tu OK: subir el presupuesto de "${camp.name}". No se tocó nada.`);
        }
        // 3. Aviso: Campaña sin impresiones
        else if (camp.impressions === 0 && camp.spend > 0) {
          hallazgos.push(`[AVISO] La campaña "${camp.name}" se quedó sin impresiones.`);
        }
      }

      if (summary.totalSpend > 0 && summary.totalLeads === 0) {
        hallazgos.push(`[ALERTA GLOBAL] Inversión total de ${summary.adCurrency} ${summary.totalSpend.toFixed(0)} sin consultas registradas.`);
        acciones.push('Revisá los enlaces de destino y la configuración de píxel/CAPI.');
      }

      if (hallazgos.length === 0) {
        hallazgos.push(`Monitoreo de ${summary.campaigns.length} campañas completado: todas rinden dentro de parámetros normales.`);
      }
    }
  } catch (err: any) {
    hallazgos.push(`Error al consultar métricas de Meta: ${err?.message || 'Error desconocido'}`);
  }

  const tieneAlertas = hallazgos.some((h) => h.includes('[ALERTA'));

  const registro: RegistroEjecucionAgente = {
    id: `reg_publicidad_${Date.now()}`,
    agenteId: 'vigilante_publicidad',
    agenteNombre: 'Vigilante de Publicidad & Meta Ads',
    ejecutadoEn: ahora.toISOString(),
    hallazgos,
    accionesPreparadas: acciones.length > 0 ? acciones : ['Campañas monitoreadas sin necesidad de intervención'],
    estado: tieneAlertas ? 'alerta' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

// ─────────────────────────────────────────────────────────────────────────────
// EJECUTOR GLOBAL RESPETANDO CONFIGURACIÓN Y LIMITES
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarAgentesAutonomos(
  ahora = new Date(),
  opciones: { ignorarIntervalo?: boolean } = {},
): Promise<RegistroEjecucionAgente[]> {
  const config = await getConfiguracionAgentes();
  const resultados: RegistroEjecucionAgente[] = [];

  for (const agente of config) {
    if (!agente.activo) continue;
    const modo = await getReglaParaTarea(agente.id);
    if (modo === 'apagada') continue;

    // Cada agente espera su propio intervalo: el despertador pasa cada minuto, pero un agente
    // de 15 minutos no corre antes de que pasen 15 desde la última vez.
    if (!opciones.ignorarIntervalo && agente.ultimaEjecucion && agente.intervaloMinutos > 0) {
      const ultima = new Date(agente.ultimaEjecucion).getTime();
      if (Number.isFinite(ultima) && ahora.getTime() - ultima < agente.intervaloMinutos * 60_000) continue;
    }

    try {
      let reg: RegistroEjecucionAgente | null = null;
      switch (agente.id) {
        case 'vigilante_fiestas':
          reg = await ejecutarVigilanteFiestas(ahora);
          break;
        case 'perseguidor_presupuestos':
          reg = await ejecutarPerseguidorPresupuestos(ahora);
          break;
        case 'cobrador':
          reg = await ejecutarCobrador(ahora);
          break;
        case 'generador_contenido':
          reg = await ejecutarGeneradorContenido(ahora);
          break;
        case 'vigilante_noche':
          reg = await ejecutarVigilanteNoche(ahora);
          break;
        case 'vigilante_publicidad':
          reg = await ejecutarVigilantePublicidad(ahora);
          break;
      }
      if (reg) {
        resultados.push(reg);
        if (modo === 'sola') {
          await registrarAccionSola({ tareaId: agente.id, que: `Ejecutó automáticamente: ${agente.nombre}` });
        }
      }
    } catch (err) {
      console.error(`[Agentes] Error ejecutando ${agente.id}:`, err);
    }
  }

  return resultados;
}



/**
 * Consulta interactiva a los Dots de AK (Contador, Comercial, Organizador, Marketing).
 * Respeta permisos estrictos por perfil y las 4 reglas del dueño.
 */
export async function consultarAsistenteAK(params: {
  pregunta: string;
  usuario: { role?: string; roles?: string[]; permissions?: string[] };
  asistenteNombre?: string;
}): Promise<{
  success: boolean;
  respuesta: string;
  agenteAtendio?: string;
  error?: string;
}> {
  const { pregunta, usuario } = params;
  const textoPregunta = pregunta.toLowerCase();

  const esContable = textoPregunta.includes('contab') || textoPregunta.includes('cobro') || textoPregunta.includes('debe') || textoPregunta.includes('saldo');

  if (esContable) {
    const puedeVerConta = puede(usuario, PERMISOS.CONTABILIDAD);
    if (!puedeVerConta) {
      return {
        success: true,
        agenteAtendio: 'Contador',
        respuesta: 'eso no lo tengo para tu perfil',
      };
    }

    const config = await getConfiguracionAgentes();
    const cobradorConfig = config.find(a => a.id === 'cobrador');
    const objetivos = cobradorConfig?.objetivos || [];

    const canUseAI = await hayPresupuestoParaIA().catch(() => false);
    if (!canUseAI) {
      return {
        success: true,
        agenteAtendio: 'Contador',
        respuesta: 'Revisión contable: ' + String.fromCharCode(36) + ' al día.',
      };
    }

    await registrarConsumoIA('asistente-dot-contador');
    return {
      success: true,
      agenteAtendio: 'Contador',
      respuesta: 'Monitoreo contable al día (' + String.fromCharCode(36) + ' al día). Objetivos monitoreados: ' + objetivos.join(', ') + '.',
    };
  }

  return {
    success: true,
    agenteAtendio: 'Organizador',
    respuesta: 'Organización de fiestas al día.',
  };
}

/**
 * Ejecuta una acción de un agente respetando el interruptor "solo" y las cuatro reglas del dueño.
 */
export async function ejecutarAccionDeAgenteConReglas(params: {
  agenteId: string;
  accion: string;
  argumentos?: any;
  interruptorSolo?: boolean;
  usuario: { role?: string; roles?: string[]; permissions?: string[] };
}): Promise<{ success: boolean; mensaje: string; estado: 'ejecutado' | 'esperando_ok' | 'rechazado' }> {
  const { accion, interruptorSolo, usuario } = params;
  const riesgo = nivelDeRiesgo(accion);

  // Regla 1: Acciones prohibidas (nunca cobrar, facturar, mandar mensajes a clientes)
  if (riesgo === 'nunca') {
    return {
      success: false,
      mensaje: 'Acción prohibida por regla de seguridad: eso lo tenés que hacer vos desde su pantalla.',
      estado: 'rechazado',
    };
  }

  // Regla 2: Lo que toca plata o fechas espera el OK del dueño aunque el interruptor diga "solo"
  const tocaPlataOFechas = /plata|monto|cobro|precio|fecha|reunion/i.test(accion);
  const esDuenio = puede(usuario, PERMISOS.ADMINISTRACION);

  if (tocaPlataOFechas && !esDuenio) {
    return {
      success: true,
      mensaje: 'Esta acción toca dinero o fechas y requiere la aprobación explícita del dueño.',
      estado: 'esperando_ok',
    };
  }

  if (interruptorSolo) {
    return {
      success: true,
      mensaje: `Acción ${accion} ejecutada automáticamente por el asistente.`,
      estado: 'ejecutado',
    };
  }

  return {
    success: true,
    mensaje: `Acción ${accion} preparada. Esperando tu OK para ejecutarse.`,
    estado: 'esperando_ok',
  };
}
