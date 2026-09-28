import type { ProgramaEventoItem, ItineraryTemplate } from '@/types/fiesta';
import type { TipoEvento } from '@/types/presupuesto';

/**
 * Sugiere una plantilla de itinerario/cronograma para la fiesta.
 * Si el programa ya tiene ítems, devuelve null (nunca pisa un programa existente).
 * Si el programa está vacío y hay una plantilla del mismo tipo de evento, la sugiere.
 */
export function sugerirPlantillaPorTipo(
  programa: ProgramaEventoItem[] | undefined | null,
  plantillas: ItineraryTemplate[],
  tipoEvento?: TipoEvento | string,
): ItineraryTemplate | null {
  if (programa && programa.length > 0) {
    return null;
  }
  if (!tipoEvento || !plantillas || plantillas.length === 0) {
    return null;
  }

  const tipoNormalizado = String(tipoEvento).toLowerCase().trim();

  const coincidencia = plantillas.find((p) => {
    if (!p.tipoEvento) return false;
    return String(p.tipoEvento).toLowerCase().trim() === tipoNormalizado;
  });

  return coincidencia || null;
}

/**
 * Ordena la lista de plantillas colocando primero las que coinciden con el tipo de fiesta.
 */
export function ordenarPlantillasPorTipo(
  plantillas: ItineraryTemplate[],
  tipoEvento?: TipoEvento | string,
): ItineraryTemplate[] {
  if (!tipoEvento) return plantillas;
  const tipoNormalizado = String(tipoEvento).toLowerCase().trim();

  return [...plantillas].sort((a, b) => {
    const aCoincide = a.tipoEvento && String(a.tipoEvento).toLowerCase().trim() === tipoNormalizado;
    const bCoincide = b.tipoEvento && String(b.tipoEvento).toLowerCase().trim() === tipoNormalizado;
    if (aCoincide && !bCoincide) return -1;
    if (!aCoincide && bCoincide) return 1;
    return a.name.localeCompare(b.name);
  });
}
