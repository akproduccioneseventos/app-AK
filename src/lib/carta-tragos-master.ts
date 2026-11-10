import type { Trago } from '@/types/fiesta';

export function tragoSeOfreceEnLaFecha(trago: Partial<Trago>, fechaEvento?: string): boolean {
  if (trago.activo === false) {
    return false;
  }
  if (!fechaEvento || !fechaEvento.trim()) {
    return true;
  }
  const partes = fechaEvento.trim().split('-');
  if (partes.length < 2) {
    return true;
  }
  const mes = parseInt(partes[1], 10);
  if (Number.isNaN(mes)) {
    return true;
  }
  if (trago.meses && trago.meses.length > 0) {
    return trago.meses.includes(mes);
  }
  return true;
}

export function mergeMasterTragosWithFiesta(
  masterItems: Trago[],
  fiestaItems: Trago[],
  fechaEvento?: string
): Trago[] {
  const fiestaById = new Map(fiestaItems.map((item) => [item.id, item]));

  const synced: Trago[] = [];
  for (const master of masterItems) {
    const fiestaItem = fiestaById.get(master.id);
    if (!fiestaItem) {
      if (!tragoSeOfreceEnLaFecha(master, fechaEvento)) {
        continue;
      }
      synced.push(master);
      continue;
    }
    synced.push({
      ...master,
      ...fiestaItem,
      ingredientes: fiestaItem.ingredientes?.length ? fiestaItem.ingredientes : master.ingredientes,
      recetaIngredientes: fiestaItem.recetaIngredientes?.length ? fiestaItem.recetaIngredientes : master.recetaIngredientes,
      recetaIngredientesSinAlcohol: fiestaItem.recetaIngredientesSinAlcohol !== undefined ? fiestaItem.recetaIngredientesSinAlcohol : master.recetaIngredientesSinAlcohol,
      stockDisponible: fiestaItem.stockDisponible ?? master.stockDisponible,
    });
  }

  const extras = fiestaItems.filter((item) => !masterItems.some((master) => master.id === item.id));
  return [...synced, ...extras];
}
