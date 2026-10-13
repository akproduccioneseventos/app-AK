import type { Presupuesto } from '@/types/presupuesto';

/**
 * Cambia UN presupuesto leyendo y guardando adentro de la misma transaccion de la base.
 *
 * Por que existe (12 de octubre de 2026): cancelar servicios y cambiar la fecha desde el portal
 * leian la lista entera de presupuestos, le sumaban la multa y la guardaban entera. Dos toques
 * seguidos calculaban los dos sobre el mismo dato viejo y se sumaban dos recargos, y una lista
 * vieja podia pisar un cobro anotado en el medio. Con la transaccion, el segundo toque vuelve
 * a leer lo que dejo el primero.
 *
 * `cambiar` devuelve el presupuesto nuevo, o `null` si no hay nada que guardar. Puede repetirse
 * si otro cambio el presupuesto en el medio: tiene que ser pura (sin efectos de afuera).
 */
export async function mutarPresupuesto(
  presupuestoId: string,
  cambiar: (actual: Presupuesto) => Presupuesto | null,
): Promise<{ encontrado: boolean; presupuesto: Presupuesto | null }> {
  const { readData, writeData, mutateDataItem } = await import('@/lib/data-service');

  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
    // Modo local de pruebas: no hay transaccion, y mutateDataItem esta deshabilitado.
    const lista = await readData<Presupuesto[]>('presupuestos.json', []);
    const indice = lista.findIndex((p) => p.id === presupuestoId);
    if (indice === -1) return { encontrado: false, presupuesto: null };
    const nuevo = cambiar(lista[indice]);
    if (!nuevo) return { encontrado: true, presupuesto: null };
    lista[indice] = nuevo;
    await writeData('presupuestos.json', lista);
    return { encontrado: true, presupuesto: nuevo };
  }

  let existe = false;
  const guardado = await mutateDataItem<Presupuesto>('presupuestos.json', 'presupuestos', presupuestoId, (actual) => {
    existe = true;
    return cambiar({ ...actual, id: actual.id || presupuestoId });
  });
  return { encontrado: existe || !!guardado, presupuesto: guardado };
}
