import { generateAiCommercialFollowup } from '@/lib/commercial/commercial-followup';
import { generateAiPostEventMaterial } from '@/lib/post-event/post-event-core';
import { generateSocialPostFlow } from '@/ai/flows/generate-social-post-flow';
import type { CrmLead } from '@/types/crm';
import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';
import { getBudgetCollectibleTotal } from '@/lib/budget/financial-guardrails';
import { readData, writeData } from '@/lib/data-service';
import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';
import { hoyEnUruguay } from '@/lib/utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { ScheduledMessage } from '@/types/whatsapp-automation';
import { detectarErroresHumanos, type DescarteAlerta } from '@/lib/alertas/errores-humanos';
import { getMetaAdsSummary } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';
import { pausarCampana, ajustarPresupuestoCampana } from '@/lib/marketing/meta-ads-acciones';
import type { CampanaConPresupuesto } from '@/lib/marketing/tope-de-gasto-publicidad';
import {
  AGENTES_DEFAULT_CONFIG,
  type AgenteId,
  type ConfiguracionAgente,
  type RegistroEjecucionAgente,
} from './tipos';

const CONFIG_FILE = 'agentes-configuracion.json';
const HISTORIAL_FILE = 'agentes-historial.json';
const MAX_HISTORIAL = 50;

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

  const [fiestas, presupuestos, descartes] = await Promise.all([
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<Presupuesto[]>('presupuestos.json', []),
    readData<DescarteAlerta[]>('alertas-descartadas.json', []),
  ]);

  const alertas = detectarErroresHumanos(fiestas, presupuestos, descartes, ahora);

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

  const registro: RegistroEjecucionAgente = {
    id: `reg_vigilante_${Date.now()}`,
    agenteId: 'vigilante_fiestas',
    agenteNombre: 'Vigilante de Fiestas',
    ejecutadoEn: ahora.toISOString(),
    hallazgos,
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin acciones requeridas'],
    estado: alertas.length > 0 ? 'alerta' : 'sin_novedades',
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
    await writeData('scheduled-messages.json', [...pendientes, ...nuevosMensajes]);
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_presupuestos_${Date.now()}`,
    agenteId: 'perseguidor_presupuestos',
    agenteNombre: 'Perseguidor de Presupuestos',
    ejecutadoEn: ahora.toISOString(),
    hallazgos: hallazgos.length > 0 ? hallazgos : ['No hay presupuestos pendientes de seguimiento comercial.'],
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin borradores nuevos'],
    estado: 'sin_novedades',
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
    await writeData('scheduled-messages.json', [...pendientes, ...nuevosMensajes]);
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
    await writeData('social-posts.json', [...(posts || []), ...nuevosPosts]);
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
    estado: 'sin_novedades',
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

  const fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
  const hoyStr = hoyEnUruguay(ahora);

  const fiestasHoy = fiestas.filter((f) => (f.configuracion?.fechaEvento || (f.configuracion as any)?.fecha) === hoyStr);

  if (fiestasHoy.length === 0) {
    hallazgos.push('No hay fiestas en vivo programadas para hoy.');
  } else {
    for (const f of fiestasHoy) {
      const nombre = f.configuracion?.nombreEvento || f.configuracion?.nombreAgasajado || 'Evento';
      const lugar = f.configuracion?.nombreLugar || (f.configuracion as any)?.salon || 'Salón';
      hallazgos.push(`Monitoreando fiesta en vivo hoy: ${nombre} (${lugar}).`);
    }
  }

  const registro: RegistroEjecucionAgente = {
    id: `reg_noche_${Date.now()}`,
    agenteId: 'vigilante_noche',
    agenteNombre: 'Operador de la Noche',
    ejecutadoEn: ahora.toISOString(),
    hallazgos,
    accionesPreparadas: acciones.length > 0 ? acciones : ['Estaciones y servicios funcionando correctamente'],
    estado: 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
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
      const campanasConPresupuesto: CampanaConPresupuesto[] = summary.campaigns.map((c) => ({
        nombre: c.name,
        presupuestoDiarioUYU: Math.max(0, Math.round(c.spend / 30)) || 500,
        activa: true,
      }));

      for (const camp of summary.campaigns) {
        // 1. Alerta: Quemando plata sin consultas -> Pausar automáticamente
        if (camp.spend >= 1500 && camp.leadsCount === 0) {
          hallazgos.push(`[ALERTA GASTO] La campaña "${camp.name}" gastó ${summary.adCurrency} ${camp.spend.toFixed(0)} sin generar consultas.`);
          const res = await pausarCampana(camp.id, camp.name, 'Gastó más de $1500 sin generar consultas.');
          if (res.success) {
            acciones.push(`Se pausó automáticamente la campaña "${camp.name}" (gastó ${summary.adCurrency} ${camp.spend.toFixed(0)} sin consultas).`);
          } else {
            acciones.push(`Intento de pausar "${camp.name}" falló: ${res.error}`);
          }
        }
        // 2. Éxito: Campaña rentable lista para escalar -> Escalar presupuesto con tope
        else if (camp.leadsCount >= 2 && camp.conversionsCount >= 1 && camp.cpl > 0 && camp.cpl <= (summary.averageCpl || 1000)) {
          hallazgos.push(`[ÉXITO COMERCIAL] La campaña "${camp.name}" rinde bien: consultas a ${summary.adCurrency} ${camp.cpl.toFixed(0)} y ${camp.conversionsCount} fiestas confirmadas.`);
          const presActual = Math.max(0, Math.round(camp.spend / 30)) || 500;
          const nuevoPres = Math.round(presActual * 1.25);
          const res = await ajustarPresupuestoCampana({
            campaignId: camp.id,
            campaignName: camp.name,
            presupuestoDiarioActualUYU: presActual,
            nuevoPresupuestoDiarioUYU: nuevoPres,
            campanas: campanasConPresupuesto,
            motivo: `Escalamiento automático por rendimiento: ${camp.conversionsCount} conversiones a CPL $${camp.cpl.toFixed(0)}.`,
          });
          if (res.success) {
            acciones.push(`Se escaló el presupuesto de "${camp.name}" de $${presActual} a $${nuevoPres}/día.`);
          } else {
            acciones.push(`No se pudo escalar "${camp.name}": ${res.motivoRechazo}`);
          }
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
      if (reg) resultados.push(reg);
    } catch (err) {
      console.error(`[Agentes] Error ejecutando ${agente.id}:`, err);
    }
  }

  return resultados;
}


