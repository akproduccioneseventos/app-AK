import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { AutomatizacionRule, AlertaAutomatica } from '@/types/automatizaciones';

// ─────────────────────────────────────────────────────────────────────────────
// Predefined rules
// ─────────────────────────────────────────────────────────────────────────────

export const REGLAS_AUTOMATICAS: AutomatizacionRule[] = [
  {
    id: 'falta-sena',
    nombre: 'Falta seña',
    descripcion: 'Fiesta creada hace más de 48hs sin primer pago registrado',
    trigger: { tipo: 'dias_despues_creacion', dias: 2, condicion: 'sin_primer_pago' },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
  {
    id: 'faltan-canciones',
    nombre: 'Faltan canciones',
    descripcion: 'A 15 días del evento no hay lista de canciones',
    trigger: { tipo: 'dias_antes_evento', dias: 15, condicion: 'sin_lista_canciones' },
    accion: { tipo: 'recordatorio_cliente', canal: 'portal' },
    activa: true,
  },
  {
    id: 'faltan-fotos-video-vida',
    nombre: 'Faltan fotos para video de vida',
    descripcion: 'A 10 días del evento las fotos del video de vida están incompletas',
    trigger: { tipo: 'dias_antes_evento', dias: 10, condicion: 'video_vida_incompleto' },
    accion: { tipo: 'recordatorio_cliente', canal: 'portal' },
    activa: true,
  },
  {
    id: 'tareas-vencidas',
    nombre: 'Hitos/tareas vencidas',
    descripcion: 'Hay hitos de la línea de tiempo que pasaron su fecha sin completarse',
    trigger: { tipo: 'campo_faltante', campo: 'timeline_hitos', diasAntes: 0 },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
  {
    id: 'cuota-vencida',
    nombre: 'Cuota vencida',
    descripcion: 'Hay cuotas del plan de pagos con fecha vencida y estado pendiente',
    trigger: { tipo: 'cuota_vencida', diasTolerancia: 0 },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
  {
    id: 'saldo-pendiente-evento-cercano',
    nombre: 'Saldo pendiente con evento cercano',
    descripcion: 'Hay saldo pendiente y el evento es en menos de 7 días',
    trigger: { tipo: 'dias_antes_evento', dias: 7, condicion: 'saldo_pendiente' },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
  {
    id: 'menu-sin-definir',
    nombre: 'Menú sin definir',
    descripcion: 'A 20 días del evento no hay menú definido',
    trigger: { tipo: 'dias_antes_evento', dias: 20, condicion: 'sin_menu' },
    accion: { tipo: 'recordatorio_cliente', canal: 'portal' },
    activa: true,
  },
  {
    id: 'invitados-sin-confirmar',
    nombre: 'Pocos invitados confirmados',
    descripcion: 'A 10 días del evento menos del 50% de invitados confirmaron',
    trigger: { tipo: 'dias_antes_evento', dias: 10, condicion: 'pocos_confirmados' },
    accion: { tipo: 'recordatorio_cliente', canal: 'portal' },
    activa: true,
  },
  {
    id: 'decoracion-sin-definir',
    nombre: 'Decoración sin definir',
    descripcion: 'A 30 días del evento no hay decoración aprobada',
    trigger: { tipo: 'dias_antes_evento', dias: 30, condicion: 'sin_decoracion' },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
  {
    id: 'cronograma-vacio',
    nombre: 'Cronograma vacío',
    descripcion: 'A 7 días del evento no hay cronograma/programa cargado',
    trigger: { tipo: 'dias_antes_evento', dias: 7, condicion: 'sin_cronograma' },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
  {
    id: 'contrato-sin-firmar',
    nombre: 'Contrato sin firmar',
    descripcion: 'Fiesta con presupuesto aprobado pero sin contrato firmado hace más de 7 días',
    trigger: { tipo: 'dias_despues_creacion', dias: 7, condicion: 'sin_contrato' },
    accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    activa: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getDiasRestantes(fiesta: FiestaEnPlanificacion): number | null {
  const fechaStr = fiesta.configuracion?.fechaEvento;
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr);
  fecha.setHours(0, 0, 0, 0);
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function mapRuleToAlertType(regla: AutomatizacionRule): AlertaAutomatica['tipo'] {
  if (regla.accion.tipo === 'alerta_interna') return 'urgente';
  if (regla.accion.tipo === 'recordatorio_cliente') return 'recordatorio';
  return 'info';
}

function buildAccionUrl(regla: AutomatizacionRule, fiestaId: string): string | undefined {
  const base = `/fiestas/nueva`;
  const q = `?fiestaId=${fiestaId}`;
  switch (regla.id) {
    case 'cuota-vencida':
    case 'saldo-pendiente-evento-cercano':
    case 'falta-sena':
      return `${base}/plan-pagos${q}`;
    case 'menu-sin-definir':
      return `${base}/catering${q}`;
    case 'invitados-sin-confirmar':
      return `${base}/invitados${q}`;
    case 'decoracion-sin-definir':
      return `${base}/decoracion${q}`;
    case 'cronograma-vacio':
    case 'tareas-vencidas':
      return `${base}/itinerario${q}`;
    case 'contrato-sin-firmar':
      return `${base}/gestion-documental${q}`;
    case 'faltan-canciones':
      return `${base}/musica${q}`;
    case 'faltan-fotos-video-vida':
      return `${base}/video-vida${q}`;
    default:
      return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition evaluators
// ─────────────────────────────────────────────────────────────────────────────

function evaluarCondicion(condicion: string, fiesta: FiestaEnPlanificacion): boolean {
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  const invitados = fiesta.invitados ?? [];
  const estimados = fiesta.configuracion?.invitadosEstimados ?? 0;
  const confirmados = invitados.filter(i => i.rsvp === 'Confirmado').length;

  switch (condicion) {
    case 'sin_primer_pago':
      return !(cuotas[0]?.estado === 'pagado');

    case 'sin_lista_canciones': {
      const m = fiesta.musica;
      return !(m?.cancionEntrada || m?.cancionVals || (m?.cancionesTortaBrindis ?? []).length > 0 || m?.playlistFiesta);
    }

    case 'video_vida_incompleto':
      return !(fiesta.videoVida?.photosUploaded === true);

    case 'saldo_pendiente':
      return cuotas.some(c => c.estado === 'pendiente' || c.estado === 'vencido' || c.estado === 'parcial');

    case 'sin_menu':
      return fiesta.modulosContratados?.catering === true && !fiesta.menuAsignadoId;

    case 'pocos_confirmados':
      return invitados.length > 0 && estimados > 0 && confirmados / estimados < 0.5;

    case 'sin_decoracion': {
      const dec = fiesta.decoracion;
      return !(dec?.tema || dec?.paletaColores);
    }

    case 'sin_cronograma':
      return (fiesta.programa ?? []).length === 0;

    case 'sin_contrato':
      return Boolean(fiesta.presupuestoId) && !fiesta.contratoFirmaInfo?.signedAt && !fiesta.contratoFirmaInfo?.isSigned && !fiesta.contratoServicioTexto;

    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main evaluator
// ─────────────────────────────────────────────────────────────────────────────

export function evaluarReglasParaFiesta(
  fiesta: FiestaEnPlanificacion,
  reglas: AutomatizacionRule[] = REGLAS_AUTOMATICAS,
): AlertaAutomatica[] {
  const alertas: AlertaAutomatica[] = [];
  const hoy = new Date();
  const diasRestantes = getDiasRestantes(fiesta);
  const fiestaId = fiesta.id ?? 'unknown';
  const fiestaName = fiesta.configuracion?.nombreEvento || 'Sin nombre';

  for (const regla of reglas) {
    if (!regla.activa) continue;

    let shouldFire = false;

    switch (regla.trigger.tipo) {
      case 'dias_antes_evento': {
        if (diasRestantes === null) break;
        if (diasRestantes >= 0 && diasRestantes <= regla.trigger.dias) {
          shouldFire = evaluarCondicion(regla.trigger.condicion, fiesta);
        }
        break;
      }

      case 'dias_despues_creacion': {
        // We don't have a "createdAt" on the fiesta, so we use the presence of
        // the presupuesto or just treat all existing fiestas as eligible.
        // For the 'sin_primer_pago' / 'sin_contrato' conditions we simply fire
        // when the condition is met (conservative approach).
        shouldFire = evaluarCondicion(regla.trigger.condicion, fiesta);
        break;
      }

      case 'cuota_vencida': {
        const cuotas = fiesta.planDePagos?.cuotas ?? [];
        shouldFire = cuotas.some(c => c.estado === 'vencido');
        break;
      }

      case 'campo_faltante': {
        if (regla.trigger.campo === 'timeline_hitos') {
          // Check if any tareas are overdue
          const tareas = fiesta.tareas ?? [];
          shouldFire = tareas.some(t => {
            if (t.completada) return false;
            if (!t.fechaLimite) return false;
            return new Date(t.fechaLimite) < hoy;
          });
        }
        break;
      }

      case 'cambio_en_portal':
        // Not yet implemented — requires real-time change detection
        break;
    }

    if (shouldFire) {
      alertas.push({
        id: `${regla.id}_${fiestaId}`,
        fiestaId,
        fiestaName,
        tipo: mapRuleToAlertType(regla),
        mensaje: regla.descripcion,
        area: regla.id.split('-')[0],
        fechaGenerada: hoy.toISOString(),
        leida: false,
        accionUrl: buildAccionUrl(regla, fiestaId),
        accionLabel: regla.nombre,
      });
    }
  }

  return alertas;
}

export function evaluarReglasParaTodasLasFiestas(
  fiestas: FiestaEnPlanificacion[],
  reglas: AutomatizacionRule[] = REGLAS_AUTOMATICAS,
): AlertaAutomatica[] {
  const todas = fiestas.flatMap(f => evaluarReglasParaFiesta(f, reglas));
  // Sort: urgente first, then recordatorio/info
  const orden: Record<AlertaAutomatica['tipo'], number> = { urgente: 0, atencion: 1, recordatorio: 2, info: 3 };
  return todas.sort((a, b) => orden[a.tipo] - orden[b.tipo]);
}
