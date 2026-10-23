import type { Presupuesto } from '@/types/presupuesto';

/**
 * Devuelve una copia del presupuesto sin datos de cobros ni saldos sensibles (para operadores sin permiso de contabilidad).
 */
export function sinCobros(presupuesto: Presupuesto): Presupuesto {
  if (!presupuesto) return presupuesto;
  const copia = { ...presupuesto };
  delete (copia as any).senia;
  delete (copia as any).saldo;
  copia.pagosCliente = [];
  return copia;
}
