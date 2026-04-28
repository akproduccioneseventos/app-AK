import type { PlanPagos, CuotaPlanPagoContrato } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';

/**
 * Calcula cuántos meses completos hay entre dos fechas.
 */
export function diferenciaMeses(desde: Date, hasta: Date): number {
  const years = hasta.getFullYear() - desde.getFullYear();
  const months = hasta.getMonth() - desde.getMonth();
  const totalMeses = years * 12 + months;
  // If the day of 'hasta' is before 'desde', subtract one partial month
  if (hasta.getDate() < desde.getDate()) {
    return Math.max(0, totalMeses - 1);
  }
  return Math.max(0, totalMeses);
}

/**
 * Calcula los meses de límite según la distancia al evento:
 * - Más de 24 meses → 12 meses antes
 * - Entre 12 y 24 meses → 6 meses antes
 * - Entre 6 y 12 meses → 6 meses antes
 * - Menos de 6 meses → 1 mes antes
 */
export function calcularMesesLimite(mesesHastaEvento: number): number {
  if (mesesHastaEvento > 24) return 12;
  if (mesesHastaEvento > 12) return 6;
  if (mesesHastaEvento > 6) return 6;
  return 1;
}

/**
 * Genera el plan completo de pagos dado fecha del evento y total del contrato.
 * Las cuotas son trimestrales desde hoy hasta el evento, con una cuota clave
 * del 30% en la fecha límite calculada dinámicamente.
 *
 * IMPORTANTE: `totalContrato` debe ser el total del contrato **sin** el ajuste
 * anual del 15% (es decir, el precio vigente a la fecha de firma, antes de
 * cualquier actualización enero a enero). Las cuotas y el monto objetivo del
 * 30% quedan fijos al momento de generar el plan y no se recalculan cuando se
 * aplica el ajuste anual pactado en la Cláusula 2 del contrato.
 */
export function generarPlanPagos(
  fechaEvento: string,
  totalContrato: number,
  pagoMinimoTrimestral = 5000,
  porcentajeMinimo = 30,
): PlanPagos {
  const hoy = new Date();
  const evento = new Date(fechaEvento);

  const mesesHastaEvento = diferenciaMeses(hoy, evento);
  const mesesLimite = calcularMesesLimite(mesesHastaEvento);

  // Fecha límite para completar el porcentaje mínimo
  const fechaLimite = new Date(evento);
  fechaLimite.setMonth(fechaLimite.getMonth() - mesesLimite);

  const montoObjetivo30 = Math.round(totalContrato * (porcentajeMinimo / 100));

  // Generar cuotas trimestrales
  const cuotas: CuotaPlanPagoContrato[] = [];
  // Normalize cursor to 1st of month for consistent quarterly intervals.
  // Installments are due at the start of the month to simplify date arithmetic.
  let cursor = new Date(hoy);
  cursor.setMonth(cursor.getMonth() + 3);
  cursor.setDate(1);

  let index = 1;
  let cuotaClaveAgregada = false;

  while (cursor < evento) {
    const esCuotaClave =
      !cuotaClaveAgregada &&
      cursor >= fechaLimite;

    if (esCuotaClave) {
      cuotaClaveAgregada = true;
    }

    cuotas.push({
      id: `cuota_${index}`,
      descripcion: esCuotaClave
        ? `Cuota clave ${porcentajeMinimo}% — ${formatDateISO(fechaLimite)}`
        : `Pago mínimo trimestral #${index}`,
      fechaVencimiento: (esCuotaClave ? fechaLimite : cursor).toISOString(),
      montoMinimo: pagoMinimoTrimestral,
      montoObjetivo: esCuotaClave ? montoObjetivo30 : undefined,
      esCuotaClave,
      estado: 'pendiente',
      pagosAplicados: [],
      montoAcumulado: 0,
    });

    cursor = new Date(cursor);
    cursor.setMonth(cursor.getMonth() + 3);
    index++;
  }

  // If we never added the clave cuota (e.g., event is very close), add it at the end
  if (!cuotaClaveAgregada && cuotas.length > 0) {
    const last = cuotas[cuotas.length - 1];
    last.esCuotaClave = true;
    last.descripcion = `Cuota clave ${porcentajeMinimo}% — ${formatDateISO(fechaLimite)}`;
    last.montoObjetivo = montoObjetivo30;
    last.fechaVencimiento = fechaLimite.toISOString();
  } else if (!cuotaClaveAgregada && cuotas.length === 0) {
    // Edge case: event is too close, just add one clave cuota
    cuotas.push({
      id: 'cuota_1',
      descripcion: `Cuota clave ${porcentajeMinimo}% — ${formatDateISO(fechaLimite)}`,
      fechaVencimiento: fechaLimite.toISOString(),
      montoMinimo: pagoMinimoTrimestral,
      montoObjetivo: montoObjetivo30,
      esCuotaClave: true,
      estado: 'pendiente',
      pagosAplicados: [],
      montoAcumulado: 0,
    });
  }

  return {
    activo: true,
    pagoMinimoTrimestral,
    porcentajeMinimoAntesFecha: porcentajeMinimo,
    mesesLimiteAntesFecha: mesesLimite,
    fechaLimite30Porciento: fechaLimite.toISOString(),
    montoObjetivo30Porciento: montoObjetivo30,
    cuotas,
    aceptadoPorCliente: false,
    generadoAt: new Date().toISOString(),
  };
}

/**
 * Recalcula el estado de las cuotas aplicando los pagos registrados.
 * Distribuye los pagos cronológicamente entre las cuotas (waterfall).
 *
 * IMPORTANTE: esta función actualiza únicamente `estado`, `montoAcumulado` y
 * `pagosAplicados`. Los campos `montoMinimo` y `montoObjetivo` se preservan
 * tal cual están almacenados en la cuota original y NUNCA se recalculan, aun
 * cuando se ejecute en años posteriores con un ajuste anual vigente.
 */
export function recalcularEstadoCuotas(
  plan: PlanPagos,
  pagos: PagoCliente[],
): PlanPagos {
  const hoy = new Date();
  const pagosOrdenados = [...pagos]
    .filter(p => p.estadoPago !== 'pendiente_confirmacion')
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  let montoPendienteDistribuir = pagosOrdenados.reduce(
    (sum, p) => sum + p.monto,
    0,
  );

  // Track how much each pago has been consumed to assign IDs accurately
  const pagoRestante = new Map<string, number>(
    pagosOrdenados.map(p => [p.id, p.monto]),
  );

  const cuotasActualizadas: CuotaPlanPagoContrato[] = plan.cuotas.map(cuota => {
    const montoObjetivo = cuota.esCuotaClave
      ? (cuota.montoObjetivo ?? plan.montoObjetivo30Porciento)
      : cuota.montoMinimo;

    const montoAplicado = Math.min(montoPendienteDistribuir, montoObjetivo);
    montoPendienteDistribuir -= montoAplicado;

    // Collect IDs of pagos that contributed to this cuota
    let aDistribuir = montoAplicado;
    const pagosAplicados: string[] = [];
    for (const pago of pagosOrdenados) {
      if (aDistribuir <= 0) break;
      const disponible = pagoRestante.get(pago.id) ?? 0;
      if (disponible <= 0) continue;
      const usado = Math.min(disponible, aDistribuir);
      pagoRestante.set(pago.id, disponible - usado);
      aDistribuir -= usado;
      pagosAplicados.push(pago.id);
    }

    const vencida = new Date(cuota.fechaVencimiento) < hoy && montoAplicado < montoObjetivo;

    let estado: CuotaPlanPagoContrato['estado'];
    if (montoAplicado >= montoObjetivo) {
      estado = 'completada';
    } else if (vencida) {
      estado = 'vencida';
    } else if (montoAplicado > 0) {
      estado = 'parcial';
    } else {
      estado = 'pendiente';
    }

    return {
      ...cuota,
      montoAcumulado: montoAplicado,
      pagosAplicados,
      estado,
    };
  });

  return { ...plan, cuotas: cuotasActualizadas };
}

/**
 * Retorna la próxima cuota pendiente o vencida.
 */
export function getProximaCuota(plan: PlanPagos): CuotaPlanPagoContrato | null {
  return (
    plan.cuotas.find(c => c.estado === 'vencida') ??
    plan.cuotas.find(c => c.estado === 'pendiente' || c.estado === 'parcial') ??
    null
  );
}

/**
 * Retorna el porcentaje del total pagado hasta ahora.
 */
export function getPorcentajePagado(
  _plan: PlanPagos,
  totalContrato: number,
  totalPagado: number,
): number {
  if (totalContrato <= 0) return 0;
  return Math.min(100, Math.round((totalPagado / totalContrato) * 100));
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
