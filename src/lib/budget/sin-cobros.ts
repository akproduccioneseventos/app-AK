import type { Presupuesto } from '@/types/presupuesto';

export function sinCobros(p: Presupuesto): Presupuesto {
  return { ...p, pagosCliente: [], senia: undefined, saldo: undefined };
}
