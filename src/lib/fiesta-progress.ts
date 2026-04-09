import type { FiestaEnPlanificacion } from '@/types/fiesta';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SemaforoStatus = 'verde' | 'amarillo' | 'rojo' | 'gris';

export interface AreaStatus {
  status: SemaforoStatus;
  label: string;
  detail: string;
  percentage: number; // 0-100
}

export interface FiestaProgressResult {
  overallPercentage: number;
  overallStatus: SemaforoStatus;
  areas: {
    pagos: AreaStatus;
    invitados: AreaStatus;
    menu: AreaStatus;
    documentos: AreaStatus;
    fotografia: AreaStatus;
    decoracion: AreaStatus;
    timeline: AreaStatus;
    musica: AreaStatus;
  };
  alertas: AlertaFiesta[];
  proximosPasos: string[];
}

export interface AlertaFiesta {
  id: string;
  tipo: 'urgente' | 'atencion' | 'info';
  mensaje: string;
  area: string;
  accionUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function diasHastaEvento(fiesta: FiestaEnPlanificacion): number | null {
  const fechaStr = fiesta.configuracion?.fechaEvento;
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr);
  fecha.setHours(0, 0, 0, 0);
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function statusLabel(status: SemaforoStatus): string {
  switch (status) {
    case 'verde':   return 'Al día';
    case 'amarillo': return 'Atención';
    case 'rojo':    return 'Urgente';
    case 'gris':    return 'Sin datos';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Area calculators (pure functions)
// ─────────────────────────────────────────────────────────────────────────────

export function calcPagosStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const cuotas = fiesta.planDePagos?.cuotas ?? [];

  if (cuotas.length === 0) {
    return { status: 'gris', label: statusLabel('gris'), detail: 'Sin plan de pagos', percentage: 0 };
  }

  const montoTotal = cuotas.reduce((sum, c) => sum + c.monto, 0);
  const montoPagado = cuotas.reduce((sum, c) => {
    if (c.estado === 'pagado') return sum + c.monto;
    if (c.estado === 'parcial') return sum + (c.montoPagado ?? 0);
    return sum;
  }, 0);
  const percentage = montoTotal > 0 ? Math.round((montoPagado / montoTotal) * 100) : 0;

  const hayVencidas = cuotas.some(c => c.estado === 'vencido');
  const todasPagadas = cuotas.every(c => c.estado === 'pagado');

  if (todasPagadas) {
    return { status: 'verde', label: 'Pagado', detail: 'Todas las cuotas pagadas', percentage: 100 };
  }
  if (hayVencidas) {
    const count = cuotas.filter(c => c.estado === 'vencido').length;
    return { status: 'rojo', label: statusLabel('rojo'), detail: `${count} cuota(s) vencida(s)`, percentage };
  }
  return { status: 'amarillo', label: statusLabel('amarillo'), detail: `${percentage}% pagado`, percentage };
}

export function calcInvitadosStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const invitados = fiesta.invitados ?? [];
  const estimados = fiesta.configuracion?.invitadosEstimados ?? 0;
  const confirmados = invitados.filter(i => i.rsvp === 'Confirmado').length;
  const dias = diasHastaEvento(fiesta);

  if (invitados.length === 0) {
    return { status: 'gris', label: statusLabel('gris'), detail: 'Sin invitados cargados', percentage: 0 };
  }

  const percentage = estimados > 0 ? Math.round((confirmados / estimados) * 100) : 0;

  if (percentage >= 80) {
    return { status: 'verde', label: statusLabel('verde'), detail: `${confirmados} confirmados (${percentage}%)`, percentage };
  }
  if (percentage < 50 && dias !== null && dias < 15) {
    return { status: 'rojo', label: statusLabel('rojo'), detail: `Solo ${percentage}% confirmado a ${dias} días del evento`, percentage };
  }
  return { status: 'amarillo', label: statusLabel('amarillo'), detail: `${confirmados} confirmados (${percentage}%)`, percentage };
}

export function calcMenuStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const cateringContratado = fiesta.modulosContratados?.catering ?? false;
  const dias = diasHastaEvento(fiesta);

  if (!cateringContratado) {
    if (dias !== null && dias < 30) {
      return { status: 'rojo', label: statusLabel('rojo'), detail: 'Catering no definido a menos de 30 días', percentage: 0 };
    }
    return { status: 'gris', label: statusLabel('gris'), detail: 'Catering no contratado', percentage: 0 };
  }

  const tieneMenu = Boolean(fiesta.menuAsignadoId);

  if (tieneMenu) {
    return { status: 'verde', label: statusLabel('verde'), detail: 'Catering contratado y menú definido', percentage: 100 };
  }
  return { status: 'amarillo', label: statusLabel('amarillo'), detail: 'Catering contratado, menú pendiente', percentage: 50 };
}

export function calcDocumentosStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const tienePresupuesto = Boolean(fiesta.presupuestoId);
  const tieneContrato = Boolean(fiesta.contratoFirmaInfo?.signedAt || fiesta.contratoFirmaInfo?.isSigned || fiesta.contratoServicioTexto);
  const dias = diasHastaEvento(fiesta);

  if (!tienePresupuesto && !tieneContrato) {
    if (dias !== null && dias < 30) {
      return { status: 'rojo', label: statusLabel('rojo'), detail: 'Sin presupuesto ni contrato', percentage: 0 };
    }
    return { status: 'gris', label: statusLabel('gris'), detail: 'Sin documentos cargados', percentage: 0 };
  }

  if (tienePresupuesto && tieneContrato) {
    return { status: 'verde', label: statusLabel('verde'), detail: 'Contrato firmado y presupuesto vinculado', percentage: 100 };
  }
  return { status: 'amarillo', label: statusLabel('amarillo'), detail: 'Presupuesto sin contrato firmado', percentage: 50 };
}

export function calcFotografiaStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const servicios = fiesta.fotografiaYFilmacion?.servicios ?? [];

  if (servicios.length === 0) {
    return { status: 'gris', label: statusLabel('gris'), detail: 'Sin servicios de foto/film', percentage: 0 };
  }

  const todos = servicios.length;
  const entregados = servicios.filter(s => s.estado === 'Entregado completo').length;
  const enProceso = servicios.filter(s =>
    s.estado === 'En edición' || s.estado === 'En revisión' || s.estado === 'Entregado parcial'
  ).length;

  const hoy = new Date();
  const hayVencidos = servicios.some(s => {
    if (s.estado !== 'Pendiente') return false;
    if (!s.fechaEntregaEstimada) return false;
    return new Date(s.fechaEntregaEstimada) < hoy;
  });

  const percentage = Math.round((entregados / todos) * 100);

  if (entregados === todos) {
    return { status: 'verde', label: statusLabel('verde'), detail: 'Todo entregado', percentage: 100 };
  }
  if (hayVencidos) {
    return { status: 'rojo', label: statusLabel('rojo'), detail: 'Hay entregas vencidas sin completar', percentage };
  }
  if (enProceso > 0) {
    return { status: 'amarillo', label: statusLabel('amarillo'), detail: `${entregados}/${todos} entregados`, percentage };
  }
  return { status: 'amarillo', label: statusLabel('amarillo'), detail: `${entregados}/${todos} entregados`, percentage };
}

export function calcDecoracionStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const dec = fiesta.decoracion;
  const dias = diasHastaEvento(fiesta);

  if (!dec) {
    if (dias !== null && dias < 30) {
      return { status: 'rojo', label: statusLabel('rojo'), detail: 'Sin decoración definida', percentage: 0 };
    }
    return { status: 'gris', label: statusLabel('gris'), detail: 'Decoración no configurada', percentage: 0 };
  }

  const tieneTema = Boolean(dec.tema);
  const tienePaleta = Boolean(dec.paletaColores);
  const tieneMoodboard = (dec.moodboardItems?.length ?? 0) > 0 || Boolean(dec.moodboardImageUrl);

  const campos = [tieneTema, tienePaleta, tieneMoodboard].filter(Boolean).length;

  if (campos === 3) {
    return { status: 'verde', label: statusLabel('verde'), detail: 'Tema, paleta y moodboard definidos', percentage: 100 };
  }
  if (campos > 0) {
    return { status: 'amarillo', label: statusLabel('amarillo'), detail: 'Decoración parcialmente definida', percentage: Math.round((campos / 3) * 100) };
  }
  if (dias !== null && dias < 30) {
    return { status: 'rojo', label: statusLabel('rojo'), detail: 'Sin decoración a menos de 30 días', percentage: 0 };
  }
  return { status: 'gris', label: statusLabel('gris'), detail: 'Decoración no configurada', percentage: 0 };
}

export function calcTimelineStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const programa = fiesta.programa ?? [];
  const dias = diasHastaEvento(fiesta);

  if (programa.length === 0) {
    if (dias !== null && dias < 7) {
      return { status: 'rojo', label: statusLabel('rojo'), detail: 'Sin cronograma a menos de 7 días', percentage: 0 };
    }
    return { status: 'gris', label: statusLabel('gris'), detail: 'Sin cronograma cargado', percentage: 0 };
  }
  if (programa.length > 3) {
    return { status: 'verde', label: statusLabel('verde'), detail: `${programa.length} ítems en el cronograma`, percentage: 100 };
  }
  return { status: 'amarillo', label: statusLabel('amarillo'), detail: `${programa.length} ítem(s) — cronograma incompleto`, percentage: 50 };
}

export function calcMusicaStatus(fiesta: FiestaEnPlanificacion): AreaStatus {
  const musica = fiesta.musica;
  const djContratado = fiesta.modulosContratados?.musica ?? false;
  const dias = diasHastaEvento(fiesta);

  const tienePlaylist = Boolean(
    musica?.cancionEntrada ||
    musica?.cancionVals ||
    (musica?.cancionesTortaBrindis ?? []).length > 0 ||
    musica?.playlistFiesta
  );

  if (!djContratado && !tienePlaylist) {
    if (dias !== null && dias < 15) {
      return { status: 'rojo', label: statusLabel('rojo'), detail: 'Sin música definida cerca del evento', percentage: 0 };
    }
    return { status: 'gris', label: statusLabel('gris'), detail: 'Música no configurada', percentage: 0 };
  }

  if (tienePlaylist) {
    return { status: 'verde', label: statusLabel('verde'), detail: 'Lista de canciones definida', percentage: 100 };
  }

  return { status: 'amarillo', label: statusLabel('amarillo'), detail: 'DJ contratado pero sin playlist', percentage: 40 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Overall progress
// ─────────────────────────────────────────────────────────────────────────────

export function calculateOverallProgress(fiesta: FiestaEnPlanificacion): number {
  let progress = 0;

  // Evento creado/reservado: +10%
  if (fiesta.id) progress += 10;

  // Seña pagada (primera cuota): +15%
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  const primeraCuota = cuotas[0];
  if (primeraCuota?.estado === 'pagado') progress += 15;

  // Menú definido: +15%
  if (fiesta.modulosContratados?.catering) progress += 15;

  // Lista de invitados cargada (>50% del estimado): +15%
  const invitados = fiesta.invitados ?? [];
  const estimados = fiesta.configuracion?.invitadosEstimados ?? 0;
  if (estimados > 0 && invitados.length / estimados > 0.5) progress += 15;

  // Pagos al día (sin cuotas vencidas): +15%
  const hayVencidas = cuotas.some(c => c.estado === 'vencido');
  if (cuotas.length > 0 && !hayVencidas) progress += 15;

  // Decoración aprobada: +10%
  if (fiesta.decoracion?.tema || fiesta.decoracion?.paletaColores) progress += 10;

  // Cronograma cargado: +10%
  if ((fiesta.programa ?? []).length > 0) progress += 10;

  // Pagos completados (100%): +10%
  const todoPagado = cuotas.length > 0 && cuotas.every(c => c.estado === 'pagado');
  if (todoPagado) progress += 10;

  return Math.min(100, progress);
}

function overallStatusFromPercentage(pct: number): SemaforoStatus {
  if (pct >= 80) return 'verde';
  if (pct >= 40) return 'amarillo';
  if (pct > 0)  return 'rojo';
  return 'gris';
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert generation
// ─────────────────────────────────────────────────────────────────────────────

export function generateAlertas(fiesta: FiestaEnPlanificacion): AlertaFiesta[] {
  const alertas: AlertaFiesta[] = [];
  const dias = diasHastaEvento(fiesta);
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  const fiestaId = fiesta.id;
  const base = fiestaId ? `/fiestas/nueva/plan-pagos?fiestaId=${fiestaId}` : undefined;

  // Cuotas vencidas
  const cuotasVencidas = cuotas.filter(c => c.estado === 'vencido');
  if (cuotasVencidas.length > 0) {
    alertas.push({
      id: 'pagos-vencidos',
      tipo: 'urgente',
      mensaje: `${cuotasVencidas.length} cuota(s) vencida(s) sin pagar`,
      area: 'pagos',
      accionUrl: base,
    });
  }

  // Saldo pendiente con evento cercano
  const haySaldoPendiente = cuotas.some(c => c.estado === 'pendiente' || c.estado === 'vencido' || c.estado === 'parcial');
  if (haySaldoPendiente && dias !== null && dias <= 7 && dias >= 0) {
    alertas.push({
      id: 'saldo-pendiente-cercano',
      tipo: 'urgente',
      mensaje: `Hay saldo pendiente y el evento es en ${dias} día(s)`,
      area: 'pagos',
      accionUrl: base,
    });
  }

  // Sin menú a menos de 20 días
  if (!fiesta.menuAsignadoId && fiesta.modulosContratados?.catering && dias !== null && dias <= 20 && dias >= 0) {
    alertas.push({
      id: 'menu-sin-definir',
      tipo: 'urgente',
      mensaje: 'Catering contratado pero menú sin definir (faltan menos de 20 días)',
      area: 'menu',
      accionUrl: fiestaId ? `/fiestas/nueva/catering?fiestaId=${fiestaId}` : undefined,
    });
  }

  // Pocos invitados confirmados a menos de 10 días
  const invitados = fiesta.invitados ?? [];
  const estimados = fiesta.configuracion?.invitadosEstimados ?? 0;
  const confirmados = invitados.filter(i => i.rsvp === 'Confirmado').length;
  const pctConf = estimados > 0 ? confirmados / estimados : 1;
  if (pctConf < 0.5 && invitados.length > 0 && dias !== null && dias <= 10 && dias >= 0) {
    alertas.push({
      id: 'pocos-invitados-confirmados',
      tipo: 'atencion',
      mensaje: 'Menos del 50% de invitados confirmados a 10 días del evento',
      area: 'invitados',
      accionUrl: fiestaId ? `/fiestas/nueva/invitados?fiestaId=${fiestaId}` : undefined,
    });
  }

  // Sin decoración a menos de 30 días
  const dec = fiesta.decoracion;
  const tieneDecoracion = dec && (dec.tema || dec.paletaColores);
  if (!tieneDecoracion && dias !== null && dias <= 30 && dias >= 0) {
    alertas.push({
      id: 'sin-decoracion',
      tipo: 'atencion',
      mensaje: 'Decoración sin definir a menos de 30 días del evento',
      area: 'decoracion',
      accionUrl: fiestaId ? `/fiestas/nueva/decoracion?fiestaId=${fiestaId}` : undefined,
    });
  }

  // Sin cronograma a menos de 7 días
  const programa = fiesta.programa ?? [];
  if (programa.length === 0 && dias !== null && dias <= 7 && dias >= 0) {
    alertas.push({
      id: 'sin-cronograma',
      tipo: 'urgente',
      mensaje: 'Sin cronograma cargado a menos de 7 días del evento',
      area: 'timeline',
      accionUrl: fiestaId ? `/fiestas/nueva/itinerario?fiestaId=${fiestaId}` : undefined,
    });
  }

  // Sin contrato pero con presupuesto
  const tienePresupuesto = Boolean(fiesta.presupuestoId);
  const tieneContrato = Boolean(fiesta.contratoFirmaInfo?.signedAt || fiesta.contratoFirmaInfo?.isSigned || fiesta.contratoServicioTexto);
  if (tienePresupuesto && !tieneContrato) {
    alertas.push({
      id: 'sin-contrato',
      tipo: 'atencion',
      mensaje: 'Presupuesto aprobado pero sin contrato firmado',
      area: 'documentos',
      accionUrl: fiestaId ? `/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}` : undefined,
    });
  }

  return alertas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export function calcFiestaProgress(fiesta: FiestaEnPlanificacion): FiestaProgressResult {
  const areas = {
    pagos:      calcPagosStatus(fiesta),
    invitados:  calcInvitadosStatus(fiesta),
    menu:       calcMenuStatus(fiesta),
    documentos: calcDocumentosStatus(fiesta),
    fotografia: calcFotografiaStatus(fiesta),
    decoracion: calcDecoracionStatus(fiesta),
    timeline:   calcTimelineStatus(fiesta),
    musica:     calcMusicaStatus(fiesta),
  };

  const overallPercentage = calculateOverallProgress(fiesta);
  const overallStatus = overallStatusFromPercentage(overallPercentage);
  const alertas = generateAlertas(fiesta);

  const proximosPasos: string[] = [];
  if (areas.pagos.status === 'rojo')      proximosPasos.push('Regularizar cuotas vencidas');
  if (areas.documentos.status !== 'verde') proximosPasos.push('Completar documentación y contrato');
  if (areas.menu.status === 'gris' || areas.menu.status === 'amarillo') proximosPasos.push('Definir menú/catering');
  if (areas.invitados.status !== 'verde') proximosPasos.push('Confirmar lista de invitados');
  if (areas.decoracion.status === 'gris' || areas.decoracion.status === 'rojo') proximosPasos.push('Definir decoración');
  if (areas.timeline.status === 'gris')  proximosPasos.push('Cargar cronograma del evento');
  if (areas.musica.status === 'gris' || areas.musica.status === 'amarillo') proximosPasos.push('Cargar lista de canciones');

  return { overallPercentage, overallStatus, areas, alertas, proximosPasos };
}
