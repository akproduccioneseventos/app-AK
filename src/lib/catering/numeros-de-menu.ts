import type { FullMenu } from '@/types/catering';

/**
 * Controles de los números de un menú antes de guardarlo.
 *
 * Vive acá y no en `menus-catering.ts` porque ese archivo es `'use server'` y
 * sólo puede exportar funciones asíncronas: hay una prueba que lo controla.
 *
 * El problema que resuelve: los campos de cantidad por persona y de costo del
 * ingrediente aceptaban números negativos. Un costo en menos hace que el plato
 * "cueste" menos que nada, y ese número entra derecho en el presupuesto del
 * cliente y en la rentabilidad del evento: se ve una ganancia que no existe. Una
 * cantidad en menos hace que la lista de compras pida comprar menos de cero, o
 * que se le reste a otro ingrediente al juntar la lista.
 */

/** Devuelve el aviso ya escrito, o null si los números están bien. */
export function numerosDeMenuInvalidos(menu: Pick<FullMenu, 'items'>): string | null {
  for (const plato of menu.items || []) {
    for (const ing of plato.ingredients || []) {
      const cantidad = Number(ing.quantityPerPerson);
      const costo = Number(ing.costoUnitario);

      if (Number.isFinite(cantidad) && cantidad < 0) {
        return `En "${plato.name}", el ingrediente "${ing.name || 'sin nombre'}" tiene una cantidad por persona negativa. `
          + 'Las cantidades no pueden ser menores que cero.';
      }
      if (Number.isFinite(costo) && costo < 0) {
        return `En "${plato.name}", el ingrediente "${ing.name || 'sin nombre'}" tiene un costo negativo. `
          + 'Un costo en menos hace que el plato parezca más barato de lo que es y desarma el presupuesto.';
      }
    }
  }
  return null;
}
