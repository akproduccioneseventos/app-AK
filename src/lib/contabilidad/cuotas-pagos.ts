import type { CuotaPlanPago } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import { roundMoney } from '@/lib/budget/financial-guardrails';

/** Identifica si una cuota corresponde al pago de seña/reserva de contrato. */
export function esCuotaDeSena(cuota?: Pick<CuotaPlanPago, 'id' | 'descripcion'> | null): boolean {
  if (!cuota) return false;
  return /se[nñ]a|reserva/i.test(`${cuota.id || ''} ${cuota.descripcion || ''}`);
}

/** Evita duplicar la seña en pagosCliente cuando ya existe por recibo de contrato. */
export function yaTieneSenaEnPagos(pagos: PagoCliente[] = [], montoCuota: number): boolean {
  return pagos.some((p) => {
    if (p.estadoPago === 'rechazado') return false;
    const ref = String(p.referencia || '');
    const esPorSena = /^SE[ÑN]A-/i.test(ref) || /se[nñ]a|reserva/i.test(ref);
    return esPorSena && (montoCuota <= 0 || Math.abs(roundMoney(p.monto) - roundMoney(montoCuota)) <= 1);
  });
}
