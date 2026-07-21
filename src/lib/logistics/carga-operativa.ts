import type {
  CargaOperativaItem,
  ListaDeCargaOperativa,
} from '@/types/fiesta';

export type CargaOperativaItemPatch = {
  cargado?: boolean;
  retornado?: boolean;
  cantidad?: string;
};

export function applyCargaOperativaItemPatch(
  lista: ListaDeCargaOperativa,
  categoryId: string,
  itemId: string,
  patch: CargaOperativaItemPatch,
  operatorName?: string,
  timestamp = new Date().toISOString(),
): ListaDeCargaOperativa {
  const operator = operatorName?.trim().slice(0, 80) || 'Equipo AK';
  let itemFound = false;

  const categorias = (lista.categorias || []).map((category) => {
    if (category.id !== categoryId) return category;
    return {
      ...category,
      items: (category.items || []).map((item) => {
        if (item.id !== itemId) return item;
        itemFound = true;

        const next: CargaOperativaItem = {
          ...item,
          ...patch,
          cantidad: patch.cantidad !== undefined ? patch.cantidad.slice(0, 30) : item.cantidad,
          actualizadoAt: timestamp,
          actualizadoPor: operator,
        };

        if (patch.cargado !== undefined) {
          next.cargadoAt = patch.cargado ? timestamp : undefined;
          next.cargadoPor = patch.cargado ? operator : undefined;
          if (!patch.cargado) {
            next.retornado = false;
            next.retornadoAt = undefined;
            next.retornadoPor = undefined;
          }
        }

        if (patch.retornado !== undefined) {
          next.retornado = patch.retornado;
          if (patch.retornado) {
            next.cargado = true;
            next.cargadoAt ||= timestamp;
            next.cargadoPor ||= operator;
            next.retornadoAt = timestamp;
            next.retornadoPor = operator;
          } else {
            next.retornadoAt = undefined;
            next.retornadoPor = undefined;
          }
        }

        return next;
      }),
    };
  });

  if (!itemFound) throw new Error('El elemento de carga ya no existe.');
  return { ...lista, categorias, updatedAt: timestamp, updatedBy: operator };
}

export function mergeCargaOperativaStructure(
  incoming: ListaDeCargaOperativa,
  current: ListaDeCargaOperativa,
): ListaDeCargaOperativa {
  const currentItems = new Map(
    (current.categorias || []).flatMap((category) =>
      (category.items || []).map((item) => [`${category.id}:${item.id}`, item] as const)
    )
  );

  return {
    ...incoming,
    updatedAt: current.updatedAt,
    updatedBy: current.updatedBy,
    categorias: (incoming.categorias || []).map((category) => ({
      ...category,
      items: (category.items || []).map((item) => {
        const currentItem = currentItems.get(`${category.id}:${item.id}`);
        if (!currentItem) return item;
        return {
          ...item,
          cargado: currentItem.cargado,
          retornado: currentItem.retornado,
          cargadoAt: currentItem.cargadoAt,
          cargadoPor: currentItem.cargadoPor,
          retornadoAt: currentItem.retornadoAt,
          retornadoPor: currentItem.retornadoPor,
          actualizadoAt: currentItem.actualizadoAt,
          actualizadoPor: currentItem.actualizadoPor,
        };
      }),
    })),
  };
}

export function mergeGeneratedCargaWithManualItems(
  generated: ListaDeCargaOperativa,
  current: ListaDeCargaOperativa,
): ListaDeCargaOperativa {
  const generatedCategories = (generated.categorias || []).map((category) => ({
    ...category,
    items: [...(category.items || [])],
  }));

  for (const currentCategory of current.categorias || []) {
    const manualItems = (currentCategory.items || []).filter((item) => !item.origenId);
    if (manualItems.length === 0) continue;

    const targetCategory = generatedCategories.find((category) =>
      category.id === currentCategory.id
      || category.nombre.trim().toLocaleLowerCase('es') === currentCategory.nombre.trim().toLocaleLowerCase('es')
    );

    if (targetCategory) {
      const knownIds = new Set(targetCategory.items.map((item) => item.id));
      targetCategory.items.push(...manualItems.filter((item) => !knownIds.has(item.id)));
    } else {
      generatedCategories.push({ ...currentCategory, items: manualItems });
    }
  }

  return {
    ...generated,
    categorias: generatedCategories,
    notasGenerales: current.notasGenerales || generated.notasGenerales,
    updatedAt: current.updatedAt,
    updatedBy: current.updatedBy,
  };
}
