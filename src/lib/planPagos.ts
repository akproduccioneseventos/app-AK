import type { PlanPagos, CuotaPlanPagoContrato } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import { isConfirmedClientPayment, roundMoney } from '@/lib/budget/financial-guardrails';

/**
 * Calcula cuántos meses completos hay entre dos fechas.
 */
export function diferenciaMeses(desde: Date, hasta: Date): number {
  const years = hasta.getUTCFullYear() - desde.getUTCFullYear();
  const months = hasta.getUTCMonth() - desde.getUTCMonth();
  const totalMeses = years * 12 + months;
  // If the day of 'hasta' is before 'desde', subtract one partial month
  if (hasta.getUTCDate() < desde.getUTCDate()) {
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
  if (!Number.isFinite(evento.getTime())) {
    throw new Error('La fecha del evento no es valida.');
  }

  const totalContratoSeguro = Math.max(0, roundMoney(totalContrato));
  const pagoMinimoSeguro = Math.max(0, roundMoney(pagoMinimoTrimestral));
  const porcentajeMinimoSeguro = Math.min(100, Math.max(0, porcentajeMinimo));
  const mesesHastaEvento = diferenciaMeses(hoy, evento);
  const mesesLimite = calcularMesesLimite(mesesHastaEvento);

  const fechaLimiteCalculada = new Date(evento);
  fechaLimiteCalculada.setMonth(fechaLimiteCalculada.getMonth() - mesesLimite);
  const fechaSaldoFinal = new Date(evento.getTime() - 15 * 24 * 60 * 60 * 1000);
  const claveDate = fechaLimiteCalculada > hoy
    ? fechaLimiteCalculada
    : new Date(hoy.getTime() + 24 * 60 * 60 * 1000);

  const montoObjetivo30 = Math.min(
    totalContratoSeguro,
    roundMoney(totalContratoSeguro * (porcentajeMinimoSeguro / 100)),
  );

  const cuotas: CuotaPlanPagoContrato[] = [];

  let cursor = new Date(hoy);
  cursor.setMonth(cursor.getMonth() + 3);
  cursor.setDate(1);

  let index = 1;
  let accumulatedTarget = 0;

  // Cuotas anteriores al hito porcentual.
  while (
    cursor < claveDate &&
    cursor < fechaSaldoFinal &&
    accumulatedTarget < totalContratoSeguro
  ) {
    const montoCuota = Math.min(
      pagoMinimoSeguro,
      totalContratoSeguro - accumulatedTarget,
    );
    cuotas.push({
      id: `cuota_${index}`,
      descripcion: `Pago mínimo trimestral #${index}`,
      fechaVencimiento: cursor.toISOString(),
      montoMinimo: montoCuota,
      esCuotaClave: false,
      estado: 'pendiente',
      pagosAplicados: [],
      montoAcumulado: 0,
    });
    accumulatedTarget += montoCuota;
    index++;

    cursor = new Date(cursor);
    cursor.setMonth(cursor.getMonth() + 3);
  }

  // La cuota clave completa el objetivo acumulado, no vuelve a cobrarlo.
  const targetClave = Math.min(
    totalContratoSeguro - accumulatedTarget,
    Math.max(0, montoObjetivo30 - accumulatedTarget),
  );
  
  cuotas.push({
    id: `cuota_clave`,
    descripcion: `Cuota clave ${porcentajeMinimoSeguro}% — ${formatDateISO(claveDate)}`,
    fechaVencimiento: claveDate.toISOString(),
    montoMinimo: targetClave,
    montoObjetivo: montoObjetivo30,
    esCuotaClave: true,
    estado: 'pendiente',
    pagosAplicados: [],
    montoAcumulado: 0,
  });
  accumulatedTarget += targetClave;

  // Add post-clave trimestral cuotas until 15 days before the event
  let cursorPost = new Date(claveDate);
  cursorPost.setMonth(cursorPost.getMonth() + 3);
  cursorPost.setDate(1);

  let postIndex = 1;
  while (cursorPost < fechaSaldoFinal && accumulatedTarget < totalContratoSeguro) {
    const diffDays = (fechaSaldoFinal.getTime() - cursorPost.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 15) break;

    const montoCuota = Math.min(
      pagoMinimoSeguro,
      totalContratoSeguro - accumulatedTarget,
    );
    cuotas.push({
      id: `cuota_post_${postIndex}`,
      descripcion: `Pago mínimo trimestral post-clave #${postIndex}`,
      fechaVencimiento: cursorPost.toISOString(),
      montoMinimo: montoCuota,
      esCuotaClave: false,
      estado: 'pendiente',
      pagosAplicados: [],
      montoAcumulado: 0,
    });
    accumulatedTarget += montoCuota;
    postIndex++;

    cursorPost = new Date(cursorPost);
    cursorPost.setMonth(cursorPost.getMonth() + 3);
  }

  // Add Saldo Final 15 days before the event
  const targetSaldoFinal = Math.max(0, totalContratoSeguro - accumulatedTarget);
  const saldoFinalDate = fechaSaldoFinal > hoy ? fechaSaldoFinal : new Date(hoy.getTime() + 48 * 60 * 60 * 1000);

  cuotas.push({
    id: `cuota_saldo_final`,
    descripcion: `Saldo Final (15 días antes del evento)`,
    fechaVencimiento: saldoFinalDate.toISOString(),
    montoMinimo: targetSaldoFinal,
    esCuotaClave: false,
    estado: 'pendiente',
    pagosAplicados: [],
    montoAcumulado: 0,
  });

  // Sort cuotas chronologically
  cuotas.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

  return {
    activo: true,
    pagoMinimoTrimestral: pagoMinimoSeguro,
    porcentajeMinimoAntesFecha: porcentajeMinimoSeguro,
    mesesLimiteAntesFecha: mesesLimite,
    fechaLimite30Porciento: claveDate.toISOString(),
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
    .filter(isConfirmedClientPayment)
    .map(p => ({ ...p, monto: roundMoney(p.monto) }))
    .filter(p => p.monto > 0)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  let montoPendienteDistribuir = pagosOrdenados.reduce(
    (sum, p) => sum + p.monto,
    0,
  );

  // Track how much each pago has been consumed to assign IDs accurately
  const pagoRestante = new Map<string, number>(
    pagosOrdenados.map(p => [p.id, p.monto]),
  );

  let objetivoProgramadoAcumulado = 0;
  const cuotasActualizadas: CuotaPlanPagoContrato[] = plan.cuotas.map(cuota => {
    const montoObjetivo = cuota.esCuotaClave
      ? Math.max(
          0,
          (cuota.montoObjetivo ?? plan.montoObjetivo30Porciento) -
            objetivoProgramadoAcumulado,
        )
      : Math.max(0, cuota.montoMinimo);
    objetivoProgramadoAcumulado += montoObjetivo;

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
  const total = roundMoney(totalContrato);
  const paid = roundMoney(totalPagado);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / total) * 100)));
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
