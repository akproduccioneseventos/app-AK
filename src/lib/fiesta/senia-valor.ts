import { montoDeSenia } from '@/lib/budget/monto-de-senia';

/**
 * Fuente única de verdad para el monto de seña en contratos, recibos y pasarela de pago:
 * usa la seña acordada en el presupuesto si es > 0, si no el valor general configurado
 * en Ajustes (`bookingDepositAmount`), y como último respaldo `SENIA_POR_DEFECTO` ($5.000).
 * Nunca calcula porcentajes arbitrarios del total (como el viejo 20%) ni $20.000 fijos.
 */
export function seniaDelContrato(
  presupuesto?: { senia?: number } | null,
  porDefecto?: number,
): number {
  return montoDeSenia({
    seniaAcordada: presupuesto?.senia,
    porDefecto,
  });
}
