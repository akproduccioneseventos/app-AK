import type { CargaOperativaItem } from '@/types/fiesta';

/**
 * Lo que esta fiesta necesita de cada equipo, sumando TODOS sus renglones (25 de septiembre
 * de 2026, LOG01 de Codex). Antes se comparaba cada renglon solo contra el stock: dos
 * renglones de 6 del mismo equipo con 10 en deposito no avisaban nada, y faltaba material.
 *
 * `base` es la lista de la fiesta tal como esta; `propuestos` pisa por identificador los
 * renglones que se estan editando (o se suman si son nuevos), asi una edicion no se cuenta
 * dos veces.
 */
export function necesidadPorEquipo(
  base: CargaOperativaItem[],
  propuestos: CargaOperativaItem[],
): Map<string, number> {
  const porRenglon = new Map<string, CargaOperativaItem>();
  for (const r of base) porRenglon.set(r.id, r);
  for (const r of propuestos) porRenglon.set(r.id, r);
  const total = new Map<string, number>();
  for (const r of porRenglon.values()) {
    if (!r.origenId) continue;
    total.set(r.origenId, (total.get(r.origenId) || 0) + (parseFloat(r.cantidad) || 0));
  }
  return total;
}
