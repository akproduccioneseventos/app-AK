import type { Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';

/**
 * Aviso de unidades que no se pueden convertir entre la receta y el catálogo.
 *
 * Vive acá y no en `menus-catering.ts` porque ese archivo es `'use server'` y
 * sólo puede exportar funciones asíncronas: hay una prueba que lo controla.
 */

/** Unidades chicas: el sistema las convierte a las grandes dividiendo por mil. */
const UNIDADES_CHICAS = ['g', 'gramos', 'ml', 'cc', 'cc.'];
const UNIDADES_GRANDES = ['kg', 'kilos', 'kilogramos', 'l', 'lt', 'litro', 'litros'];

/**
 * Avisa cuando la receta y el catálogo usan unidades que el sistema NO sabe
 * convertir entre sí. Por ejemplo: la receta pide "2 tazas" y el insumo está
 * cargado en gramos.
 *
 * En ese caso el cálculo multiplica como si fueran la misma unidad y el costo
 * del plato sale mal. Nadie puede saber cuántos gramos pesa una taza de ese
 * ingrediente sin que alguien lo diga: es preferible avisar y que lo revisen,
 * antes que inventar un número y meterlo en todos los presupuestos.
 *
 * Devuelve el aviso ya escrito, o null si está todo bien.
 */
export function unidadesQueNoSePuedenConvertir(
  ing: Partial<Ingredient>,
  catalogItems: ServicioEmpresa[],
): string | null {
  const unidadReceta = (ing.unit || '').toLowerCase().trim();
  const catalogItem = ing.origenId ? catalogItems.find(item => item.id === ing.origenId) : null;
  const unidadCatalogo = (catalogItem?.unidad || '').toLowerCase().trim();

  if (!unidadReceta || !unidadCatalogo) return null;
  if (unidadReceta === unidadCatalogo) return null;
  if (unidadReceta === 'no definido') return null;

  const conocidas = [...UNIDADES_CHICAS, ...UNIDADES_GRANDES];
  if (conocidas.includes(unidadReceta) && conocidas.includes(unidadCatalogo)) return null;

  return `"${ing.name || 'un ingrediente'}" está en ${ing.unit} y en el catálogo figura en ${catalogItem?.unidad}. `
    + 'El sistema no puede convertir entre esas dos unidades, así que el costo de ese plato puede salir mal.';
}

/** Todos los avisos de un menú entero, sin repetir. */
export function avisosDeUnidadesDelMenu(
  ingredientes: Partial<Ingredient>[],
  catalogItems: ServicioEmpresa[],
): string[] {
  const avisos = ingredientes
    .map(ing => unidadesQueNoSePuedenConvertir(ing, catalogItems))
    .filter((aviso): aviso is string => aviso !== null);
  return Array.from(new Set(avisos));
}
