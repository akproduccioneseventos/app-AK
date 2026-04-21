import type { Trago } from '@/types/fiesta';

export function mergeMasterTragosWithFiesta(
  masterItems: Trago[],
  fiestaItems: Trago[]
): Trago[] {
  const fiestaById = new Map(fiestaItems.map((item) => [item.id, item]));

  const synced = masterItems.map((master) => {
    const fiestaItem = fiestaById.get(master.id);
    if (!fiestaItem) {
      return master;
    }
    return {
      ...master,
      ...fiestaItem,
      ingredientes: fiestaItem.ingredientes?.length ? fiestaItem.ingredientes : master.ingredientes,
      stockDisponible: fiestaItem.stockDisponible ?? master.stockDisponible,
    };
  });

  const extras = fiestaItems.filter((item) => !masterItems.some((master) => master.id === item.id));
  return [...synced, ...extras];
}

