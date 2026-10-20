import type { GestionCostosData } from '@/types/fiesta';

/** Un monto estimado tiene que ser un número de verdad y no negativo (orden 168). */
export function errorEnLosCostos(costos: GestionCostosData | null | undefined): string | null {
  for (const item of costos?.costosItems || []) {
    if (item.montoEstimado !== undefined && item.montoEstimado !== null) {
      const val = Number(item.montoEstimado);
      if (!Number.isFinite(val) || val < 0) {
        return `El monto estimado de "${item.nombre || 'ítem'}" debe ser un número válido mayor o igual a 0.`;
      }
    }
  }
  return null;
}
