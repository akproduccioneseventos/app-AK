import type { PlanPagos, CuotaPlanPagoContrato } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import { isConfirmedClientPayment, roundMoney } from '@/lib/budget/financial-guardrails';
import { hoyEnUruguay, parseUruguayDate } from '@/lib/utils';

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
 *
 * El plan sigue la CLÁUSULA 3 del contrato que firma el cliente
 * (`docs/contratos/contrato-base-2026-10-01.txt`), y no al revés:
 * - un mínimo de $10.000 en cada período de tres meses desde la firma;
 * - el 30% al cumplirse el primer tercio del tiempo entre la firma y la fiesta;
 * - el 50% a la mitad de ese tiempo;
 * - el total, treinta días antes del evento.
 * Antes el plan guardaba $5.000 y el saldo a 15 días mientras el contrato decía $10.000 y 30 días: el cliente firmaba
 * una cosa y el portal le cobraba otra (auditoría del 18/11/2026, A18-01).
 *
 * IMPORTANTE: `totalContrato` debe ser el total del contrato **sin** el ajuste
 * anual del 15% (es decir, el precio vigente a la fecha de firma, antes de
 * cualquier actualización enero a enero). Las cuotas y los objetivos quedan
 * fijos al momento de generar el plan y no se recalculan cuando se aplica el
 * ajuste anual pactado en la Cláusula 2 del contrato.
 */
export const PAGO_MINIMO_TRIMESTRAL_DEL_CONTRATO = 10000;
export const DIAS_SALDO_ANTES_DEL_EVENTO = 30;

const UN_DIA = 24 * 60 * 60 * 1000;

export function generarPlanPagos(
  fechaEvento: string,
  totalContrato: number,
  pagoMinimoTrimestral = PAGO_MINIMO_TRIMESTRAL_DEL_CONTRATO,
  porcentajeMinimo = 30,
): PlanPagos {
  if (!fechaEvento || Number.isNaN(new Date(fechaEvento).getTime())) {
    throw new Error('La fecha del evento no es valida.');
  }
  const hoyStr = hoyEnUruguay();
  const hoy = parseUruguayDate(hoyStr);
  const eventoDiaStr = /^\d{4}-\d{2}-\d{2}$/.test(fechaEvento.trim())
    ? fechaEvento.trim()
    : hoyEnUruguay(parseUruguayDate(fechaEvento));
  const evento = parseUruguayDate(eventoDiaStr);

  const totalContratoSeguro = Math.max(0, roundMoney(totalContrato));
  const pagoMinimoSeguro = Math.max(0, roundMoney(pagoMinimoTrimestral));
  const porcentajeMinimoSeguro = Math.min(100, Math.max(0, porcentajeMinimo));
  const porcentajeMitad = Math.max(50, porcentajeMinimoSeguro);

  const diasHastaEvento = Math.max(0, Math.round((evento.getTime() - hoy.getTime()) / UN_DIA));
  const manana = new Date(hoy.getTime() + UN_DIA);
  const enDias = (dias: number) => {
    const fecha = new Date(hoy.getTime() + dias * UN_DIA);
    return fecha > hoy ? fecha : manana;
  };

  // Cláusula 3 c) y d): el primer tercio y la mitad del tiempo entre la firma y la fiesta.
  const claveDate = enDias(Math.floor(diasHastaEvento / 3));
  const mitadDate = enDias(Math.floor(diasHastaEvento / 2));
  // Cláusula 3 f): el total, treinta días antes del evento.
  const fechaSaldoFinal = new Date(evento.getTime() - DIAS_SALDO_ANTES_DEL_EVENTO * UN_DIA);
  const saldoFinalDate = fechaSaldoFinal > hoy ? fechaSaldoFinal : new Date(hoy.getTime() + 2 * UN_DIA);

  const montoObjetivo30 = Math.min(
    totalContratoSeguro,
    roundMoney(totalContratoSeguro * (porcentajeMinimoSeguro / 100)),
  );
  const montoObjetivo50 = Math.min(
    totalContratoSeguro,
    roundMoney(totalContratoSeguro * (porcentajeMitad / 100)),
  );

  type Paso =
    | { tipo: 'trimestral'; fecha: Date }
    | { tipo: 'clave'; fecha: Date }
    | { tipo: 'mitad'; fecha: Date }
    | { tipo: 'saldo'; fecha: Date };

  const pasos: Paso[] = [];
  // Cláusula 3 b): un mínimo en cada período de tres meses, hasta el saldo final.
  const cursor = new Date(hoy);
  cursor.setMonth(cursor.getMonth() + 3);
  while (cursor.getTime() < saldoFinalDate.getTime() - 15 * UN_DIA) {
    pasos.push({ tipo: 'trimestral', fecha: new Date(cursor) });
    cursor.setMonth(cursor.getMonth() + 3);
  }
  pasos.push({ tipo: 'clave', fecha: claveDate });
  if (mitadDate.getTime() > claveDate.getTime() && mitadDate.getTime() < saldoFinalDate.getTime()) {
    pasos.push({ tipo: 'mitad', fecha: mitadDate });
  }
  pasos.push({ tipo: 'saldo', fecha: saldoFinalDate });
  const orden = { trimestral: 0, clave: 1, mitad: 2, saldo: 3 } as const;
  pasos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || orden[a.tipo] - orden[b.tipo]);

  const cuotas: CuotaPlanPagoContrato[] = [];
  let acumulado = 0;
  let indice = 1;
  for (const paso of pasos) {
    const falta = Math.max(0, totalContratoSeguro - acumulado);
    if (paso.tipo === 'trimestral') {
      if (falta <= 0) continue;
      const monto = Math.min(pagoMinimoSeguro, falta);
      if (monto <= 0) continue;
      cuotas.push({
        id: `cuota_${indice}`,
        descripcion: `Pago mínimo trimestral #${indice}`,
        fechaVencimiento: formatDateISO(paso.fecha),
        montoMinimo: monto,
        esCuotaClave: false,
        estado: 'pendiente',
        pagosAplicados: [],
        montoAcumulado: 0,
      });
      acumulado += monto;
      indice++;
    } else if (paso.tipo === 'clave') {
      // La cuota clave completa el objetivo acumulado, no vuelve a cobrarlo.
      const monto = Math.min(falta, Math.max(0, montoObjetivo30 - acumulado));
      cuotas.push({
        id: 'cuota_clave',
        descripcion: `Cuota clave ${porcentajeMinimoSeguro}% — ${formatDateISO(paso.fecha)}`,
        fechaVencimiento: formatDateISO(paso.fecha),
        montoMinimo: monto,
        montoObjetivo: montoObjetivo30,
        esCuotaClave: true,
        estado: 'pendiente',
        pagosAplicados: [],
        montoAcumulado: 0,
      });
      acumulado += monto;
    } else if (paso.tipo === 'mitad') {
      const monto = Math.min(falta, Math.max(0, montoObjetivo50 - acumulado));
      if (monto <= 0) continue;
      cuotas.push({
        id: 'cuota_mitad',
        descripcion: `${porcentajeMitad}% a la mitad del plazo — ${formatDateISO(paso.fecha)}`,
        fechaVencimiento: formatDateISO(paso.fecha),
        montoMinimo: monto,
        montoObjetivo: montoObjetivo50,
        esCuotaClave: false,
        estado: 'pendiente',
        pagosAplicados: [],
        montoAcumulado: 0,
      });
      acumulado += monto;
    } else {
      cuotas.push({
        id: 'cuota_saldo_final',
        descripcion: `Saldo Final (${DIAS_SALDO_ANTES_DEL_EVENTO} días antes del evento)`,
        fechaVencimiento: formatDateISO(paso.fecha),
        montoMinimo: falta,
        esCuotaClave: false,
        estado: 'pendiente',
        pagosAplicados: [],
        montoAcumulado: 0,
      });
      acumulado += falta;
    }
  }

  return {
    activo: true,
    pagoMinimoTrimestral: pagoMinimoSeguro,
    porcentajeMinimoAntesFecha: porcentajeMinimoSeguro,
    mesesLimiteAntesFecha: diferenciaMeses(claveDate, evento),
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
  const hoyStr = hoyEnUruguay();
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

    const rawVenc = String(cuota.fechaVencimiento || '').trim();
    const soloDia = rawVenc.match(/^(\d{4}-\d{2}-\d{2})$/);
    const vencStr = soloDia
      ? hoyEnUruguay(parseUruguayDate(soloDia[1]))
      : Number.isNaN(new Date(rawVenc).getTime())
      ? ''
      : hoyEnUruguay(parseUruguayDate(rawVenc));
    const vencida = Boolean(vencStr) && vencStr < hoyStr && montoAplicado < montoObjetivo;

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
  return hoyEnUruguay(date);
}
