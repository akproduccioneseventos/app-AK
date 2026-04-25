/**
 * AK Producciones — Auditoría de Presupuestos
 *
 * auditPresupuestoTotals valida y recalcula todos los totales de un presupuesto,
 * incluyendo el manejo correcto de descuentos promocionales (modoDescuentoPromocional)
 * y markup de marketing. Los descuentos promocionales son lógica comercial válida,
 * no errores.
 *
 * TODO (Fase 4) — UI de auditoría de presupuesto: PENDIENTE
 * Agregar botón "Auditar presupuesto" en la vista de presupuesto (/presupuestos/[id]/ver).
 * Al hacer clic debe mostrar un panel/modal con:
 *   - subtotalItems
 *   - regalos
 *   - descuento promocional
 *   - total a pagar
 *   - seña
 *   - saldo
 *   - pagos
 *   - advertencias
 * Este componente debe usar auditPresupuestoTotals() de este archivo.
 */

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';

export type AuditSeverity = 'info' | 'advertencia' | 'error';

export interface AuditObservacion {
  campo: string;
  mensaje: string;
  severidad: AuditSeverity;
  valorEsperado?: number;
  valorReal?: number;
}

export interface AuditResult {
  /** Subtotal de ítems no regalo */
  subtotalItems: number;
  /** Subtotal de ítems regalo (costo visual $0) */
  subtotalRegalos: number;
  /** Descuento calculado según tipo/valor */
  descuentoCalculado: number;
  /** Precio de lista con markup visual (si aplica) */
  precioListaConMarkup?: number;
  /** Total real (lo que AK efectivamente cobra) */
  totalReal: number;
  /** Total con descuento tal como figura en el presupuesto */
  totalConDescuentoGuardado: number;
  /** Saldo pendiente = totalReal - pagos recibidos */
  saldoPendiente: number;
  /** Total de pagos registrados en pagosCliente */
  totalPagosRegistrados: number;
  /** Observaciones sobre inconsistencias */
  observaciones: AuditObservacion[];
  /** El presupuesto está matemáticamente consistente */
  esConsistente: boolean;
}

/**
 * Calcula y valida todos los totales de un presupuesto.
 * Trata modoDescuentoPromocional y marketingMarkupPercent como lógica válida.
 */
export function auditPresupuestoTotals(presupuesto: Presupuesto): AuditResult {
  const observaciones: AuditObservacion[] = [];

  // 1. Recalcular subtotales desde los ítems
  const subtotalItems = presupuesto.itemsPresupuestados
    .filter(item => !item.esRegalo)
    .reduce((sum, item) => sum + (item.costoTotalItem ?? 0), 0);

  const subtotalRegalos = presupuesto.itemsPresupuestados
    .filter(item => item.esRegalo)
    .reduce((sum, item) => sum + (item.costoTotalItem ?? 0), 0);

  // 2. Validar costoTotalEstimado
  const tolerancia = 1; // $1 de tolerancia por redondeos
  if (Math.abs((presupuesto.costoTotalEstimado ?? 0) - subtotalItems) > tolerancia) {
    observaciones.push({
      campo: 'costoTotalEstimado',
      mensaje: `El subtotal de ítems calculado ($${subtotalItems.toFixed(0)}) difiere del almacenado ($${presupuesto.costoTotalEstimado?.toFixed(0) ?? '?'}).`,
      severidad: 'advertencia',
      valorEsperado: subtotalItems,
      valorReal: presupuesto.costoTotalEstimado,
    });
  }

  // 3. Calcular descuento real
  let descuentoCalculado = 0;
  if (presupuesto.descuentoTipo === 'porcentaje' && presupuesto.descuentoValor) {
    descuentoCalculado = Math.round(subtotalItems * (presupuesto.descuentoValor / 100));
  } else if (presupuesto.descuentoTipo === 'fijo' && presupuesto.descuentoValor) {
    descuentoCalculado = presupuesto.descuentoValor;
  }

  const totalReal = subtotalItems - descuentoCalculado;

  // 4. Modo descuento promocional: el precio "de lista" se infla y el descuento es visual.
  //    Esto es lógica comercial válida. El totalReal no cambia.
  let precioListaConMarkup: number | undefined;
  if (presupuesto.modoDescuentoPromocional) {
    if (presupuesto.marketingMarkupPercent && presupuesto.marketingMarkupPercent > 0) {
      precioListaConMarkup = Math.round(totalReal * (1 + presupuesto.marketingMarkupPercent / 100));
      observaciones.push({
        campo: 'modoDescuentoPromocional',
        mensaje: `Descuento promocional activo: precio de lista $${precioListaConMarkup.toFixed(0)}, total real $${totalReal.toFixed(0)} (diferencia visual: $${(precioListaConMarkup - totalReal).toFixed(0)}).`,
        severidad: 'info',
        valorEsperado: precioListaConMarkup,
        valorReal: totalReal,
      });
    } else {
      observaciones.push({
        campo: 'modoDescuentoPromocional',
        mensaje: 'Modo descuento promocional activo pero sin marketingMarkupPercent definido.',
        severidad: 'advertencia',
      });
    }
  }

  // 5. Validar totalConDescuento almacenado vs calculado
  const totalConDescuentoGuardado = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado ?? 0;
  if (Math.abs(totalConDescuentoGuardado - totalReal) > tolerancia) {
    observaciones.push({
      campo: 'totalConDescuento',
      mensaje: `Total con descuento almacenado ($${totalConDescuentoGuardado.toFixed(0)}) difiere del calculado ($${totalReal.toFixed(0)}).`,
      severidad: 'advertencia',
      valorEsperado: totalReal,
      valorReal: totalConDescuentoGuardado,
    });
  }

  // 6. Calcular pagos registrados y saldo pendiente
  const totalPagosRegistrados = (presupuesto.pagosCliente ?? []).reduce(
    (sum, p) => sum + (p.monto ?? 0),
    0
  );
  const saldoPendiente = totalConDescuentoGuardado - totalPagosRegistrados;

  // 7. Validar saldo almacenado
  if (presupuesto.saldo !== undefined && Math.abs(presupuesto.saldo - saldoPendiente) > tolerancia) {
    observaciones.push({
      campo: 'saldo',
      mensaje: `Saldo almacenado ($${presupuesto.saldo.toFixed(0)}) difiere del calculado ($${saldoPendiente.toFixed(0)}).`,
      severidad: 'advertencia',
      valorEsperado: saldoPendiente,
      valorReal: presupuesto.saldo,
    });
  }

  // 8. Validar seña almacenada vs primer pago
  if (presupuesto.senia !== undefined && totalPagosRegistrados > 0) {
    const primerPago = presupuesto.pagosCliente?.[0]?.monto ?? 0;
    if (Math.abs(presupuesto.senia - primerPago) > tolerancia && totalPagosRegistrados > 0) {
      // Solo informativo; la seña puede haber sido actualizada posteriormente
      observaciones.push({
        campo: 'senia',
        mensaje: `La seña almacenada ($${presupuesto.senia.toFixed(0)}) difiere del primer pago registrado ($${primerPago.toFixed(0)}).`,
        severidad: 'info',
      });
    }
  }

  const errores = observaciones.filter(o => o.severidad === 'error');
  const esConsistente = errores.length === 0;

  return {
    subtotalItems,
    subtotalRegalos,
    descuentoCalculado,
    precioListaConMarkup,
    totalReal,
    totalConDescuentoGuardado,
    saldoPendiente,
    totalPagosRegistrados,
    observaciones,
    esConsistente,
  };
}
