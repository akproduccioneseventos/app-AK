import type { FiestaEnPlanificacion, CuotaPlanPago } from '@/types/fiesta';

export type TipoProblemaFiesta =
  | 'pasada_sin_archivar'
  | 'sin_presupuesto_o_servicios'
  | 'faltan_datos_clave'
  | 'cliente_igual_al_agasajado'
  | 'cuotas_vencidas';

export interface ProblemaFiesta {
  tipo: TipoProblemaFiesta;
  titulo: string;
  descripcion: string;
  accionSugerida: 'archivar' | 'abrir_presupuesto' | 'editar_datos' | 'aclarar_quien_contrata' | 'ver_cuotas';
  etiquetaBoton: string;
}

export interface FiestaParaRevisar {
  fiestaId: string;
  nombreEvento: string;
  clienteNombre?: string;
  agasajadoNombre?: string;
  fechaEvento?: string;
  estado?: string;
  totalCobrado: number;
  problemas: ProblemaFiesta[];
}

export interface LiquidacionSuspension {
  totalPresupuesto: number;
  penalidad30: number;
  totalCobrado: number;
  diferenciaACobrar: number;
  saldoAFavor: number;
}

/** Comprueba si una fiesta está en estado suspendida. */
export function esFiestaSuspendida(fiesta: FiestaEnPlanificacion | null | undefined): boolean {
  if (!fiesta) return false;
  const estado = (fiesta.estado || '').toLowerCase().trim();
  return estado === 'suspendida';
}

/** Suspende una fiesta a mano, manteniendo intacto su dinero cobrado. */
export function suspenderFiesta(
  fiesta: FiestaEnPlanificacion,
  motivo: string,
  fecha: string = new Date().toISOString().split('T')[0]
): FiestaEnPlanificacion {
  return {
    ...fiesta,
    estado: 'suspendida',
    motivoSuspension: motivo,
    fechaSuspension: fecha,
  };
}

/** Reactiva una fiesta suspendida y la vuelve a planificación activa. */
export function reactivarFiesta(fiesta: FiestaEnPlanificacion): FiestaEnPlanificacion {
  const copia: FiestaEnPlanificacion = { ...fiesta, estado: 'En Planificación' };
  delete (copia as any).motivoSuspension;
  delete (copia as any).fechaSuspension;
  return copia;
}

/** Calcula el dinero cobrado y la penalidad del contrato (30% sobre presupuesto vigente). */
export function calcularLiquidacionSuspension(
  fiesta: FiestaEnPlanificacion,
  presupuestoVigenteTotal?: number
): LiquidacionSuspension {
  const totalPresupuesto = presupuestoVigenteTotal ?? (fiesta.configuracion?.presupuestoEstimado || 0);
  const penalidad30 = Math.round(totalPresupuesto * 0.30);

  const cuotas: CuotaPlanPago[] = fiesta.planDePagos?.cuotas || [];
  const totalCobrado = cuotas.reduce((acc, c) => {
    if (c.estado === 'pagado') {
      return acc + (c.montoPagado || c.monto || 0);
    }
    return acc + (c.montoPagado || 0);
  }, 0);

  const diferenciaACobrar = Math.max(0, penalidad30 - totalCobrado);
  const saldoAFavor = Math.max(0, totalCobrado - penalidad30);

  return {
    totalPresupuesto,
    penalidad30,
    totalCobrado,
    diferenciaACobrar,
    saldoAFavor,
  };
}

/** Detecta qué tiene de raro una fiesta para resolver con un toque. */
export function detectarProblemasFiesta(
  fiesta: FiestaEnPlanificacion,
  opciones?: { presupuestos?: any[]; hoy?: Date }
): ProblemaFiesta[] {
  const problemas: ProblemaFiesta[] = [];
  const hoy = opciones?.hoy || new Date();
  const hoyStr = hoy.toISOString().split('T')[0];

  const estado = (fiesta.estado || '').toLowerCase().trim();
  const esArchivada = estado === 'archivada' || estado === 'archivado' || estado === 'cerrada';
  const esSuspendida = estado === 'suspendida';

  // 1. Ya pasó y no está cerrada ni archivada ni suspendida
  const fechaEvento = fiesta.configuracion?.fechaEvento;
  if (fechaEvento && fechaEvento < hoyStr && !esArchivada && !esSuspendida) {
    problemas.push({
      tipo: 'pasada_sin_archivar',
      titulo: 'Fiesta pasada sin archivar',
      descripcion: `La fiesta fue el ${fechaEvento} y sigue activa en el sistema.`,
      accionSugerida: 'archivar',
      etiquetaBoton: 'Archivar',
    });
  }

  // 2. No tiene presupuesto o el presupuesto no tiene servicios
  const presupuestoId = fiesta.presupuestoId;
  let presupuestoTieneServicios = false;
  if (presupuestoId && opciones?.presupuestos) {
    const pres = opciones.presupuestos.find((p) => p.id === presupuestoId);
    if (pres) {
      const items = pres.items || pres.servicios || [];
      presupuestoTieneServicios = items.length > 0;
    }
  } else if (presupuestoId) {
    // Si no se pasaron presupuestos, asumimos que tiene id vinculado a menos que explícitamente se marque sin servicios
    presupuestoTieneServicios = true;
  }

  if (!presupuestoId || (opciones?.presupuestos && !presupuestoTieneServicios)) {
    problemas.push({
      tipo: 'sin_presupuesto_o_servicios',
      titulo: 'Sin presupuesto o sin servicios cargados',
      descripcion: !presupuestoId
        ? 'No tiene un presupuesto formal vinculado.'
        : 'El presupuesto vinculado no contiene servicios.',
      accionSugerida: 'abrir_presupuesto',
      etiquetaBoton: 'Abrir presupuesto',
    });
  }

  // 3. Le faltan datos clave (fecha, salón o invitados)
  const faltaFecha = !fechaEvento || fechaEvento.trim() === '';
  const faltaSalon = !fiesta.configuracion?.nombreLugar || fiesta.configuracion.nombreLugar.trim() === '';
  const faltanInvitados = !fiesta.configuracion?.invitadosEstimados || fiesta.configuracion.invitadosEstimados <= 0;

  if (faltaFecha || faltaSalon || faltanInvitados) {
    const faltantes = [
      faltaFecha && 'fecha',
      faltaSalon && 'salón',
      faltanInvitados && 'cantidad de invitados',
    ].filter(Boolean).join(', ');

    problemas.push({
      tipo: 'faltan_datos_clave',
      titulo: 'Faltan datos clave de la fiesta',
      descripcion: `Falta cargar: ${faltantes}.`,
      accionSugerida: 'editar_datos',
      etiquetaBoton: 'Completar datos',
    });
  }

  // 4. El nombre del cliente es igual al del agasajado
  const clienteNombre = (fiesta.configuracion?.clienteNombre || '').trim().toLowerCase();
  const agasajadoNombre = (
    fiesta.configuracion?.nombreAgasajado ||
    fiesta.configuracion?.protagonista1Nombre ||
    ''
  ).trim().toLowerCase();

  if (clienteNombre && agasajadoNombre && clienteNombre === agasajadoNombre) {
    problemas.push({
      tipo: 'cliente_igual_al_agasajado',
      titulo: '¿Quién contrata? Cliente y agasajado se llaman igual',
      descripcion: `El cliente y el agasajado figuran como "${fiesta.configuracion?.clienteNombre}". Conviene separar quién contrata de quién festeja.`,
      accionSugerida: 'aclarar_quien_contrata',
      etiquetaBoton: '¿Quién contrata?',
    });
  }

  // 5. Tiene cuotas vencidas sin cobrar
  const cuotas = fiesta.planDePagos?.cuotas || [];
  const cuotasVencidas = cuotas.filter((c) => c.estado === 'vencido' || (c.fechaVencimiento && c.fechaVencimiento < hoyStr && c.estado !== 'pagado'));
  if (cuotasVencidas.length > 0) {
    problemas.push({
      tipo: 'cuotas_vencidas',
      titulo: 'Cuotas vencidas sin cobrar',
      descripcion: `Tiene ${cuotasVencidas.length} cuota(s) vencida(s) pendiente(s) de cobro.`,
      accionSugerida: 'ver_cuotas',
      etiquetaBoton: 'Ver cuotas',
    });
  }

  return problemas;
}

/** Devuelve la lista de fiestas que tienen problemas para resolver en "Revisar mis fiestas". */
export function obtenerFiestasParaRevisar(
  fiestas: FiestaEnPlanificacion[],
  opciones?: { presupuestos?: any[]; hoy?: Date }
): FiestaParaRevisar[] {
  const resultado: FiestaParaRevisar[] = [];

  for (const f of fiestas) {
    const problemas = detectarProblemasFiesta(f, opciones);
    if (problemas.length > 0) {
      const cuotas = f.planDePagos?.cuotas || [];
      const totalCobrado = cuotas.reduce((acc, c) => acc + (c.estado === 'pagado' ? (c.montoPagado || c.monto || 0) : (c.montoPagado || 0)), 0);

      resultado.push({
        fiestaId: f.id,
        nombreEvento: f.configuracion?.nombreEvento || `Fiesta ${f.id}`,
        clienteNombre: f.configuracion?.clienteNombre,
        agasajadoNombre: f.configuracion?.nombreAgasajado || f.configuracion?.protagonista1Nombre,
        fechaEvento: f.configuracion?.fechaEvento,
        estado: f.estado,
        totalCobrado,
        problemas,
      });
    }
  }

  return resultado;
}
