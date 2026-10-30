import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { CrmAppointment } from '@/types/crm';
import { calcularHorariosDisponibles, type TimeSlot } from '@/lib/agenda/horarios-disponibles';
import { getFiestaTimeRange, localDateTimeToUtcMs } from '@/lib/staff-agenda-conflicts';
import { hoyEnUruguay } from '@/lib/utils';

export type TipoPlanMultipaso = 'reunion_cliente' | 'preparar_semana_fiesta' | 'seguimiento_presupuestos';
export interface DatosPlanMultipaso {
  fiestas?: FiestaEnPlanificacion[];
  presupuestos?: Presupuesto[];
  citas?: CrmAppointment[];
  telefonosConMensajePendiente?: string[];
  ahora?: Date;
  puedeVerAgenda: boolean;
  puedeVerPresupuestos: boolean;
  modoSeguimiento?: 'sola' | 'preguntar' | 'apagada';
  fallaAgenda?: boolean;
  fallaPresupuestos?: boolean;
  fallaCitas?: boolean;
}
export interface PlanMultipaso {
  tipo: TipoPlanMultipaso;
  titulo: string;
  pasos: [string, string, string];
  fiestaId?: string;
  clienteNombre?: string;
  borrador?: { telefono: string; texto: string; presupuestoId: string };
  horarioCandidato?: TimeSlot & { duracionMinutos: 30; googleVerificado: false };
}
export type ResultadoPlanMultipaso = { plan: PlanMultipaso } | { pregunta: string } | null;

export function detectarTipoPlanMultipaso(texto: string): TipoPlanMultipaso | null {
  const t = normalizar(texto);
  const reunion = /\b(reunion|encuentro|cita)\b/.test(t) && /\b(cliente|novios|pareja)\b/.test(t);
  const semana = /\b(semana|preparar|prepara|organizar|organiza)\b/.test(t) && /\b(fiesta|evento)\b/.test(t) && !reunion;
  const seguimiento = /\b(presupuestos?|seguimientos?|perseguir|sin respuesta|no respondieron)\b/.test(t);
  if ([reunion, semana, seguimiento].filter(Boolean).length !== 1) return null;
  return reunion ? 'reunion_cliente' : semana ? 'preparar_semana_fiesta' : 'seguimiento_presupuestos';
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function nombreFiesta(fiesta: FiestaEnPlanificacion): string {
  const c = fiesta.configuracion;
  return c.clienteNombre || c.protagonista1Nombre || c.nombreAgasajado || c.nombreEvento;
}

function fechaFiesta(fiesta: FiestaEnPlanificacion): string | undefined {
  return fiesta.configuracion.fechaEvento;
}

function sabadoDeReferencia(ahora: Date): string {
  const local = new Date(`${hoyEnUruguay(ahora)}T12:00:00Z`);
  local.setUTCDate(local.getUTCDate() + (6 - local.getUTCDay() + 7) % 7);
  return local.toISOString().slice(0, 10);
}

function candidatoSinChoques(datos: DatosPlanMultipaso): { slot: TimeSlot } | { pregunta: string } {
  if (datos.fallaCitas || !datos.citas) return { pregunta: 'No pude verificar las citas de la agenda interna; probá de nuevo antes de coordinar.' };
  const ahora = datos.ahora || new Date();
  const desde = localDateTimeToUtcMs(hoyEnUruguay(ahora), '00:00')!;
  const hasta = ahora.getTime() + 7 * 86_400_000;
  const rangos: Array<{ inicio: number; fin: number }> = [];
  const agregarReunion = (fecha: string | undefined, hora: string | undefined): boolean => {
    if (!fecha || !hora) return false;
    const inicio = localDateTimeToUtcMs(fecha, hora);
    if (inicio === null) return false;
    // No hay duración en estos modelos: no ofrecemos horas posteriores ese mismo día.
    const fin = localDateTimeToUtcMs(fecha, '00:00')! + 86_400_000;
    if (fin > desde && inicio < hasta) rangos.push({ inicio, fin });
    return true;
  };
  for (const fiesta of datos.fiestas || []) {
    if (/^(cancelada|suspendida|archivada)$/i.test(fiesta.estado || '')) continue;
    const fecha = fiesta.configuracion.fechaEvento?.slice(0, 10);
    const medianoche = fecha ? localDateTimeToUtcMs(fecha, '00:00') : null;
    if (medianoche === null) return { pregunta: 'Hay una fiesta sin fecha verificable. Confirmá su fecha antes de consultar un horario libre.' };
    if (medianoche + 2 * 86_400_000 > desde && medianoche < hasta) {
      const rango = getFiestaTimeRange(fiesta);
      if (!rango) return { pregunta: 'Hay una fiesta con horario incompleto. Confirmá inicio y fin antes de consultar un horario libre.' };
      rangos.push({ inicio: rango.startMs, fin: rango.endMs });
    }
    for (const reunion of fiesta.reuniones || []) {
      if (!agregarReunion(reunion.fecha?.slice(0, 10), reunion.hora)) {
        return { pregunta: 'Hay una reunión de fiesta sin fecha/hora completas. Confirmá esos datos antes de consultar disponibilidad.' };
      }
    }
  }
  for (const cita of datos.citas) {
    if (cita.estado === 'Cancelada') continue;
    const fechaHora = cita.fechaHora?.trim() || '';
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(fechaHora)) {
      return { pregunta: 'Hay una cita sin fecha/hora completas. Confirmá esos datos antes de consultar disponibilidad.' };
    }
    const conZona = /(?:Z|[+-]\d{2}:\d{2})$/.test(fechaHora) ? fechaHora : `${fechaHora}-03:00`;
    const inicio = Date.parse(conZona);
    if (!Number.isFinite(inicio)) return { pregunta: 'Hay una cita con fecha inválida; revisala antes de coordinar.' };
    const fecha = hoyEnUruguay(new Date(inicio));
    const fin = localDateTimeToUtcMs(fecha, '00:00')! + 86_400_000;
    if (fin > desde && inicio < hasta) rangos.push({ inicio, fin });
  }
  const slot = calcularHorariosDisponibles(datos.citas, 7, ahora)
    .flatMap((dia) => dia.slots)
    .find((candidato) => {
      const inicio = Date.parse(candidato.datetimeIso);
      const fin = inicio + 30 * 60_000;
      return inicio < hasta && fin <= localDateTimeToUtcMs(hoyEnUruguay(new Date(inicio)), '18:00')! &&
        !rangos.some((rango) => inicio < rango.fin && fin > rango.inicio);
    });
  return slot ? { slot } : { pregunta: 'No encontré un horario candidato de 30 minutos sin choques internos en los próximos siete días. ¿Qué rango alternativo querés revisar?' };
}

function redactarSeguimiento(p: Presupuesto): string {
  return `Hola ${p.clienteNombre}, ¿cómo estás? Te escribo de AK Producciones para saber si pudiste revisar la propuesta para el evento${p.eventoFecha ? ` del ${p.eventoFecha.slice(0, 10)}` : ''}. Si querés coordinar una reunión o ajustar servicios, avisame y lo vemos juntos.`;
}

export function prepararPlanMultipaso(texto: string, datos: DatosPlanMultipaso): ResultadoPlanMultipaso {
  const t = normalizar(texto);
  const tipo = detectarTipoPlanMultipaso(texto);
  if (!tipo) return null;
  const reunion = tipo === 'reunion_cliente';
  const seguimiento = tipo === 'seguimiento_presupuestos';

  if (seguimiento) {
    if (!datos.puedeVerPresupuestos) return { pregunta: 'No tengo permiso para revisar presupuestos. Pedí ayuda a alguien con acceso.' };
    if (datos.modoSeguimiento === 'apagada') return { pregunta: 'El perseguidor de presupuestos está apagado en Tus reglas; no preparé borrador.' };
    if (datos.fallaPresupuestos) return { pregunta: 'No pude verificar los presupuestos; no preparé ningún borrador.' };
    const exacto = texto.match(/\b(?:presupuesto|cliente)\s+["“]([^"”]+)["”]/i)?.[1];
    const candidatos = (datos.presupuestos || []).filter((presupuesto) => {
      if (exacto && normalizar(presupuesto.clienteNombre) !== normalizar(exacto) && presupuesto.id !== exacto) return false;
      if (presupuesto.estado !== 'Enviado' || !presupuesto.clienteContacto) return false;
      return !(datos.telefonosConMensajePendiente || []).includes(presupuesto.clienteContacto.trim());
    });
    if (!candidatos.length) return { pregunta: 'No encontré presupuestos Enviados con contacto y sin mensaje pendiente.' };
    if (candidatos.length > 1) return { pregunta: 'Encontré varios presupuestos que cumplen. Indicá el ID o cliente exacto para preparar uno solo.' };
    const p = candidatos[0];
    const telefono = p.clienteContacto!.trim();
    const textoBorrador = redactarSeguimiento(p);
    return { plan: {
      tipo: 'seguimiento_presupuestos', titulo: `Revisar seguimiento de presupuesto: ${p.clienteNombre}`,
      pasos: [
        `Verificado: presupuesto ${p.id}, estado Enviado y contacto registrado. La fecha de envío no está disponible en el esquema; antigüedad no verificada.`,
        `Borrador concreto para ${p.clienteNombre} (${telefono}): ${textoBorrador}`,
        datos.modoSeguimiento === 'sola'
          ? 'Preparación permitida por la regla, pero el envío sigue requiriendo toque manual; no se envía ni agenda.'
          : 'Pendiente de OK: una persona debe revisar el borrador y abrir WhatsApp manualmente. No se envía ni se agenda.',
      ], clienteNombre: p.clienteNombre, borrador: { telefono, texto: textoBorrador, presupuestoId: p.id },
    } };
  }

  if (!datos.puedeVerAgenda) return { pregunta: 'No tengo permiso para consultar fiestas y reuniones.' };
  if (datos.fallaAgenda) return { pregunta: 'No pude verificar la agenda; no preparé el plan.' };
  const eventos = datos.fiestas || [];
  const idSolicitado = texto.match(/\b(?:fiesta|evento|cliente)\s+id\s*[:#]?\s*([a-z0-9_-]{4,})\b/i)?.[1];
  const nombreSolicitado = texto.match(/\b(?:cliente|fiesta|evento)\s+(?:de\s+)?["“]([^"”]+)["”]/i)?.[1];
  const fechaObjetivo = /\bsabado\b/.test(t) ? sabadoDeReferencia(datos.ahora || new Date()) : undefined;
  if (reunion && !idSolicitado && !nombreSolicitado && !fechaObjetivo) {
    return { pregunta: '¿De qué cliente o evento es la reunión? Indicá su nombre exacto o ID; no elegiré por la fecha sola.' };
  }
  const candidatos = eventos.filter((f) => {
    if (f.id.startsWith('demo_') || /^(?:suspendid[ao]|cancelad[ao]|archivad[ao]|demo ak)$/i.test(f.estado || '')) return false;
    if (reunion && /\bnovios\b/.test(t) && !idSolicitado && !nombreSolicitado
      && !['boda', 'bodas', 'casamiento'].includes(normalizar(f.configuracion.tipoCelebracion || ''))) return false;
    if (idSolicitado && f.id !== idSolicitado) return false;
    if (nombreSolicitado) {
      const nombres = [nombreFiesta(f), f.configuracion.nombreEvento, f.configuracion.clienteNombre];
      if (!nombres.some((nombre) => nombre && normalizar(nombre) === normalizar(nombreSolicitado))) return false;
    }
    if (fechaObjetivo && fechaFiesta(f)?.slice(0, 10) !== fechaObjetivo) return false;
    return Boolean(idSolicitado || nombreSolicitado || fechaObjetivo);
  });
  if (!idSolicitado && !nombreSolicitado && !fechaObjetivo) return { pregunta: 'Indicá el nombre exacto o ID del cliente/evento; no voy a elegir una fiesta por parecido.' };
  if (!candidatos.length) return { pregunta: fechaObjetivo
    ? `No encontré una fiesta para el próximo sábado (${fechaObjetivo}, hora Uruguay). Indicá el nombre exacto o ID del cliente/evento.`
    : 'Indicá el nombre exacto o ID del cliente/evento; no voy a elegir una fiesta por parecido.' };
  if (candidatos.length > 1) return { pregunta: 'Hay más de una coincidencia. Indicá el ID exacto de la fiesta.' };

  const fiesta = candidatos[0];
  const nombre = nombreFiesta(fiesta);
  const fecha = fechaFiesta(fiesta);
  const presupuesto = datos.puedeVerPresupuestos
    ? (datos.presupuestos || []).find((p) => p.id === fiesta.presupuestoId)
    : undefined;
  const presupuestoResumen = !datos.puedeVerPresupuestos
    ? 'omitido por permisos financieros'
    : datos.fallaPresupuestos ? 'no se pudo verificar el presupuesto'
      : presupuesto ? `presupuesto ${presupuesto.id}, estado ${presupuesto.estado}` : 'no hay presupuesto vinculado encontrado';
  const deco = fiesta.decoracion;
  const decoResumen = deco
    ? `tema ${deco.tema || 'sin tema'}, ${(deco.items || []).map((item) => `${item.name} (cantidad ${item.quantity})`).join(', ') || 'sin ítems registrados'}`
    : 'sin decoración registrada';
  const reunionExistente = (fiesta.reuniones || []).map((r) => `${r.titulo}${r.fecha ? ` (${r.fecha}${r.hora ? ` ${r.hora}` : ''})` : ' (sin fecha/hora)'}`).join('; ')
    || 'no hay reuniones registradas';
  if (reunion) {
    if (!datos.puedeVerPresupuestos || datos.fallaPresupuestos) return { pregunta: 'No pude consultar el contacto del presupuesto con tus permisos. Revisá el teléfono con alguien autorizado antes de preparar la reunión.' };
    const telefono = presupuesto?.clienteContacto?.trim();
    if (!presupuesto || !telefono || !/^\+?[\d\s().-]+$/.test(telefono) || telefono.replace(/\D/g, '').length < 8) {
      return { pregunta: 'Falta un teléfono válido en el presupuesto vinculado. Confirmalo en la ficha antes de preparar el borrador.' };
    }
    const disponibilidad = candidatoSinChoques(datos);
    if ('pregunta' in disponibilidad) return disponibilidad;
    const { slot } = disponibilidad;
    const dia = hoyEnUruguay(new Date(slot.datetimeIso));
    const textoBorrador = `Hola ${presupuesto.clienteNombre}, queremos coordinar una reunión de 30 minutos para revisar el presupuesto y la decoración de ${fiesta.configuracion.nombreEvento}. ¿Te queda cómodo el ${dia} a las ${slot.time} (hora Uruguay)? Es un horario candidato; falta confirmar disponibilidad Google. No está reservado.`;
    return { plan: {
      tipo: 'reunion_cliente', titulo: `Preparar reunión con ${nombre}`,
      pasos: [
        `Consultado: ${dia} ${slot.time}, horario candidato de 30 minutos en agenda interna, confirmar disponibilidad Google. Sin colisiones internas; sin hora de fin registrada se bloqueó el resto del día de cada cita/reunión. No se reservó.`,
        `Borrador para ${presupuesto.clienteNombre} (${telefono}): ${textoBorrador} Pendiente de OK para guardarlo en la bandeja manual; no se envió.`,
        `Datos reales consultados: ${presupuestoResumen}; decoración: ${decoResumen}. No se creó ni agendó una reunión.`,
      ], fiestaId: fiesta.id, clienteNombre: presupuesto.clienteNombre,
      borrador: { telefono, texto: textoBorrador, presupuestoId: presupuesto.id },
      horarioCandidato: { ...slot, duracionMinutos: 30, googleVerificado: false },
    } };
  }
  return { plan: {
    tipo: 'preparar_semana_fiesta', titulo: `Revisar semana de ${nombre}`,
    pasos: [
      `Ficha encontrada: ${nombre}, evento ${fecha || 'sin fecha registrada'}; ${(fiesta.tareas || []).length} tarea(s) registradas.`,
      `Reuniones: ${reunionExistente}. No se calculó disponibilidad horaria ni se agregaron tareas.`,
      `Datos reales consultados: ${presupuestoResumen}; decoración: ${decoResumen}. El resumen queda para revisión; no modifica la ficha.`,
    ], fiestaId: fiesta.id, clienteNombre: nombre,
  } };
}
