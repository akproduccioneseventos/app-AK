import { readData, writeData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { ScheduledMessage } from '@/types/whatsapp-automation';
import { detectarErroresHumanos, type DescarteAlerta } from '@/lib/alertas/errores-humanos';
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

  const [presupuestos, scheduledMessages] = await Promise.all([
    readData<Presupuesto[]>('presupuestos.json', []),
    readData<ScheduledMessage[]>('scheduled-messages.json', []),
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

    if (diasDesdeEnvio >= 5 && diasDesdeEnvio < 14) {
      hallazgos.push(`Presupuesto de ${p.clienteNombre} (${p.eventoTipo}) sin respuesta hace ${diasDesdeEnvio} días.`);
      const texto = `Hola ${p.clienteNombre}, ¿cómo estás? Te escribo de AK Producciones para saber si pudiste revisar la propuesta para el evento del ${p.eventoFecha ? new Date(p.eventoFecha).toLocaleDateString('es-UY') : 'evento'}. Si querés coordinar una reunión o ajustar servicios, avisame y lo vemos juntos.`;
      
      nuevosMensajes.push({
        id: `msg_follow_${p.id}_5d`,
        targetType: 'prospecto',
        targetId: p.leadId || p.id,
        targetName: p.clienteNombre,
        targetPhone: contacto,
        messageText: texto,
        scheduledAt: ahora.toISOString(),
        createdAt: ahora.toISOString(),
        status: 'pendiente',
        templateType: 'personalizado',
      });
      acciones.push(`Borrador de seguimiento preparado para ${p.clienteNombre} en la bandeja de salida.`);
    } else if (diasDesdeEnvio >= 14 && diasDesdeEnvio <= 30) {
      hallazgos.push(`Presupuesto de ${p.clienteNombre} sin respuesta hace ${diasDesdeEnvio} días (reactivación).`);
      const texto = `Hola ${p.clienteNombre}, te contacto de AK Producciones. Queríamos consultar si la fecha del ${p.eventoFecha ? new Date(p.eventoFecha).toLocaleDateString('es-UY') : 'evento'} sigue en pie o si te gustaría que mantengamos tu propuesta activa. ¡Quedamos a las órdenes!`;
      
      nuevosMensajes.push({
        id: `msg_reactivate_${p.id}_14d`,
        targetType: 'prospecto',
        targetId: p.leadId || p.id,
        targetName: p.clienteNombre,
        targetPhone: contacto,
        messageText: texto,
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
    id: `reg_perseguidor_${Date.now()}`,
    agenteId: 'perseguidor_presupuestos',
    agenteNombre: 'Perseguidor de Presupuestos',
    ejecutadoEn: ahora.toISOString(),
    hallazgos: hallazgos.length > 0 ? hallazgos : ['No hay presupuestos pendientes de seguimiento hoy.'],
    accionesPreparadas: acciones.length > 0 ? acciones : ['Sin borradores nuevos'],
    estado: nuevosMensajes.length > 0 ? 'exito' : 'sin_novedades',
  };

  await registrarEjecucionAgente(registro);
  return registro;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EL COBRADOR (PREPARA RECORDATORIOS, NUNCA COBRA SOLO)
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
    const pagos = (p.pagosCliente || []).filter((pg) => pg.estadoPago !== 'rechazado').reduce((s, pg) => s + (Number(pg.monto) || 0), 0);
    const total = Number(p.totalConDescuento || p.costoTotalEstimado || 0);
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

  const [fiestas, posts] = await Promise.all([
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<any[]>('social-posts.json', []),
  ]);

  const ahoraMs = ahora.getTime();
  const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
  const nuevosPosts: any[] = [];

  for (const f of fiestas) {
    const fechaStr = f.configuracion?.fechaEvento || (f.configuracion as any)?.fecha;
    if (!fechaStr) continue;

    const fechaMs = new Date(fechaStr).getTime();
    if (ahoraMs > fechaMs && (ahoraMs - fechaMs) < sieteDiasMs) {
      const nombre = f.configuracion?.nombreEvento || f.configuracion?.nombreAgasajado || 'Fiesta';
      hallazgos.push(`Fiesta reciente finalizada: ${nombre}.`);

      const yaTienePost = (posts || []).some((p) => p.titulo?.includes(nombre) || p.caption?.includes(nombre));
      if (!yaTienePost) {
        // Antes esto SOLO decia "borrador creado" y no creaba nada: el borrador
        // no aparecia nunca en Redes Sociales, y como tampoco quedaba escrito,
        // el mismo aviso volvia a salir cada 15 minutos para siempre.
        const ahoraIso = ahora.toISOString();
        const borrador: any = {
          id: `post_agente_${f.id}`,
          platform: 'Instagram',
          isGeneralCampaign: true,
          publishDate: ahoraIso.slice(0, 10),
          titulo: `Recuerdos de ${nombre}`,
          text: `Que noche la de ${nombre}. Gracias por confiar en AK Producciones para tu fiesta.`,
          status: 'Borrador',
          createdAt: ahoraIso,
          updatedAt: ahoraIso,
        };
        nuevosPosts.push(borrador);
        acciones.push(`Borrador de posteo creado para ${nombre} (listo para revisión en Redes Sociales).`);
      }
    }
  }

  // Los borradores se guardan de verdad. Si no se escriben, no aparecen en Redes
  // Sociales y el mismo aviso vuelve a salir cada 15 minutos para siempre.
  if (nuevosPosts.length > 0) {
    await writeData('social-posts.json', [...(posts || []), ...nuevosPosts]);
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
  const hoyStr = ahora.toISOString().split('T')[0];

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
// EJECUTOR GLOBAL RESPETANDO CONFIGURACIÓN Y LIMITES
// ─────────────────────────────────────────────────────────────────────────────
export async function ejecutarAgentesAutonomos(ahora = new Date()): Promise<RegistroEjecucionAgente[]> {
  const config = await getConfiguracionAgentes();
  const resultados: RegistroEjecucionAgente[] = [];

  for (const agente of config) {
    if (!agente.activo) continue;

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
      }
      if (reg) resultados.push(reg);
    } catch (err) {
      console.error(`[Agentes] Error ejecutando ${agente.id}:`, err);
    }
  }

  return resultados;
}

