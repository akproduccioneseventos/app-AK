import type { Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { convertir, normalizarUnidad } from '@/lib/compras/unidades';

/**
 * Aviso y cálculo de unidades entre la receta y el catálogo.
 *
 * Vive acá y no en `menus-catering.ts` porque ese archivo es `'use server'` y
 * sólo puede exportar funciones asíncronas: hay una prueba que lo controla.
 */

const PESO_CHICO = new Set(['g', 'gr', 'grs', 'gramo', 'gramos']);
const VOLUMEN_CHICO = new Set(['ml', 'cc', 'mililitro', 'mililitros']);
const UNIDAD_CONTABLE = new Set(['u', 'ud', 'uds', 'unidad', 'unidades']);
// Docena equivale a 12 unidades en recetas y catálogo (Orden 368 B5.3).
const DOCENA_CONTABLE = new Set(['doc', 'docena', 'docenas']);

function factorContable(unidad: string): number | null {
  if (UNIDAD_CONTABLE.has(unidad)) return 1;
  if (DOCENA_CONTABLE.has(unidad)) return 12;
  return null;
}

function convertirCatering(cantidad: number, de?: string | null, a?: string | null): number | null {
  const base = convertir(cantidad, de, a);
  if (base !== null) return base;
  const origen = (de || '').toLowerCase().trim().replace(/\.$/, '');
  const destino = (a || '').toLowerCase().trim().replace(/\.$/, '');
  const fOrigen = factorContable(origen);
  const fDestino = factorContable(destino);
  if (fOrigen !== null && fDestino !== null) {
    return (cantidad * fOrigen) / fDestino;
  }
  return null;
}

function esUnidadReconocida(unidad: string): boolean {
  const { unidad: base } = normalizarUnidad(unidad);
  return base === 'kg' || base === 'l';
}

/**
 * Calcula el costo de un ingrediente en una receta convirtiendo entre la unidad
 * de la receta (ej. gr, grs, g, kg, mililitros, ml, l, Unidad, Docena) y la del catálogo.
 * Si ambas unidades están definidas y siguen sin poder convertirse, devuelve 0
 * para no inventar costos (queda reflejado en `unidadesQueNoSePuedenConvertir`).
 */
export function calcularCostoIngredienteEnReceta(
  quantity: number,
  unitCost: number,
  recipeUnitRaw?: string | null,
  catalogUnitRaw?: string | null,
): number {
  if (quantity === 0 || unitCost === 0) return 0;

  const recipeUnit = (recipeUnitRaw || '').toLowerCase().trim().replace(/\.$/, '');
  const catalogUnit = (catalogUnitRaw || '').toLowerCase().trim().replace(/\.$/, '');

  const recetaChica = PESO_CHICO.has(recipeUnit) || VOLUMEN_CHICO.has(recipeUnit) || recipeUnit === 'no definido';
  const catalogoChico = PESO_CHICO.has(catalogUnit) || VOLUMEN_CHICO.has(catalogUnit);
  const comoAntes = () => (recetaChica && !catalogoChico ? quantity / 1000 : quantity) * unitCost;

  if (!recipeUnit || recipeUnit === 'no definido') return comoAntes();

  // Si el catálogo no especifica unidad pero la receta está en gramos/mililitros, se asume kg/l.
  let targetUnit = catalogUnit;
  if (!targetUnit) {
    if (PESO_CHICO.has(recipeUnit)) targetUnit = 'kg';
    else if (VOLUMEN_CHICO.has(recipeUnit)) targetUnit = 'l';
    else return quantity * unitCost;
  }

  const converted = convertirCatering(quantity, recipeUnit, targetUnit);
  if (converted !== null) {
    return converted * unitCost;
  }

  return 0;
}

/**
 * Avisa cuando la receta y el catálogo usan unidades que el sistema NO sabe
 * convertir entre sí (por ejemplo: tazas contra gramos, o peso contra volumen).
 *
 * Devuelve el aviso ya escrito, o null si está todo bien.
 */
export function unidadesQueNoSePuedenConvertir(
  ing: Partial<Ingredient>,
  catalogItems: ServicioEmpresa[],
): string | null {
  const unidadReceta = (ing.unit || '').toLowerCase().trim().replace(/\.$/, '');
  const catalogItem = ing.origenId ? catalogItems.find(item => item.id === ing.origenId) : null;
  const unidadCatalogo = (catalogItem?.unidad || '').toLowerCase().trim().replace(/\.$/, '');

  if (!unidadReceta || !unidadCatalogo) return null;
  if (unidadReceta === unidadCatalogo) return null;
  if (unidadReceta === 'no definido') return null;

  if (convertirCatering(1, unidadReceta, unidadCatalogo) !== null) return null;

  const baseReceta = normalizarUnidad(unidadReceta).unidad;
  const baseCatalogo = normalizarUnidad(unidadCatalogo).unidad;
  if (
    esUnidadReconocida(unidadReceta) &&
    esUnidadReconocida(unidadCatalogo) &&
    baseReceta !== baseCatalogo
  ) {
    return `"${ing.name || 'un ingrediente'}" está en ${ing.unit} (${baseReceta === 'kg' ? 'peso' : 'volumen'}) y en el catálogo figura en ${catalogItem?.unidad} (${baseCatalogo === 'kg' ? 'peso' : 'volumen'}). `
      + 'No se puede mezclar peso contra volumen automáticamente, así que el costo de ese plato puede salir mal.';
  }

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
