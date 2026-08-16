import type { BebidasData, FiestaEnPlanificacion } from '@/types/fiesta';

describe('Organización Bloque A — Bebidas en Lista de Compras', () => {
  const mockBebidas: BebidasData = {
    categorias: [
      {
        id: 'refrescos_gaseosas',
        nombreDisplay: 'Refrescos / Gaseosas',
        activada: true,
        items: [
          {
            id: 'item-cocacola',
            nombre: 'Coca Cola 2.25L',
            cantidadNecesaria: 20,
            unidadCantidad: 'Botellas',
            costoUnitario: 120,
            proveedorHabitual: 'Distribuidora Bebidas',
            origenId: 'insumo-coca',
          },
        ],
      },
      {
        id: 'vinos_espumantes',
        nombreDisplay: 'Vinos y Espumantes',
        activada: false,
        items: [
          {
            id: 'item-vino',
            nombre: 'Vino Tinto Reserva',
            cantidadNecesaria: 12,
            unidadCantidad: 'Botellas',
            costoUnitario: 350,
            proveedorHabitual: 'Bodega Central',
            origenId: 'insumo-vino',
          },
        ],
      },
    ],
  };

  function computeDrinkShoppingList(bebidas?: BebidasData, totalInvitados = 100) {
    const rawList: any[] = [];
    if (bebidas?.categorias) {
      bebidas.categorias
        .filter((c) => c.activada)
        .forEach((cat) => {
          cat.items?.forEach((item) => {
            rawList.push({
              nombre: item.nombre,
              cantidadNecesaria: item.cantidadNecesaria || 1,
              unit: item.unidadCantidad || 'Unidad',
              costoUnitario: item.costoUnitario || 0,
              proveedor: item.proveedorHabitual || 'Proveedor Bebidas',
              origen: `Bebidas: ${cat.nombreDisplay}`,
              origenId: item.origenId,
              isOrder: true,
            });
          });
          cat.recetas?.forEach((receta: any) => {
            const factorEscala = totalInvitados / (receta.porcionesBase || 1);
            receta.ingredientes?.forEach((ing: any) => {
              const totalNeeded = (ing.cantidad || 0) * (isNaN(factorEscala) ? 1 : factorEscala);
              if (totalNeeded > 0) {
                rawList.push({
                  nombre: ing.nombre,
                  cantidadNecesaria: totalNeeded,
                  unit: ing.unidad || 'Unidad',
                  costoUnitario: ing.costoUnitario || 0,
                  proveedor: 'Proveedor Bebidas',
                  origen: `Bebidas (Receta): ${receta.nombre}`,
                  origenId: ing.id,
                });
              }
            });
          });
        });
    }

    // Consolidador por nombre y proveedor
    const consolidated: Record<string, any> = {};
    rawList.forEach((raw) => {
      const key = `${raw.nombre.toLowerCase()}-${raw.proveedor.toLowerCase().trim()}`;
      if (consolidated[key]) {
        consolidated[key].cantidadNecesaria += raw.cantidadNecesaria;
      } else {
        consolidated[key] = { ...raw, id: key };
      }
    });

    return Object.values(consolidated);
  }

  test('incluye ítems de categorías activadas en la lista de compras', () => {
    const list = computeDrinkShoppingList(mockBebidas, 100);
    expect(list.some((item) => item.nombre === 'Coca Cola 2.25L')).toBe(true);
    const cocaItem = list.find((item) => item.nombre === 'Coca Cola 2.25L');
    expect(cocaItem?.cantidadNecesaria).toBe(20);
  });

  test('excluye categorías desactivadas de la lista de compras', () => {
    const list = computeDrinkShoppingList(mockBebidas, 100);
    expect(list.some((item) => item.nombre === 'Vino Tinto Reserva')).toBe(false);
  });

  test('sincronizar dos veces no duplica ítems consolidados', () => {
    const list1 = computeDrinkShoppingList(mockBebidas, 100);
    const list2 = computeDrinkShoppingList(mockBebidas, 100);
    expect(list1).toEqual(list2);
    expect(list2.length).toBe(1);
  });
});
