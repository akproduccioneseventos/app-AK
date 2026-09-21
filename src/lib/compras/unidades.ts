/**
 * Unidades de la lista de compras.
 *
 * Lo encontro Codex el 20 de septiembre de 2026: la lista juntaba los ingredientes
 * por nombre y proveedor **sin mirar la unidad**, asi que 200 g de manteca de un plato
 * y 2 kg de manteca de otro terminaban sumados como "202" de lo que viniera primero.
 * La compra salia por menos de la decima parte de lo que hace falta.
 *
 * Aca se pasa todo a una unidad base (kilos para peso, litros para volumen) antes de
 * sumar, y se muestra en la unidad que se entiende: gramos si es poco, kilos si es mucho.
 */

export type UnidadBase = { unidad: string; factor: number };

const PESO = new Set(['g', 'gr', 'grs', 'gramo', 'gramos']);
const PESO_BASE = new Set(['kg', 'kgs', 'kilo', 'kilos', 'kilogramo', 'kilogramos']);
const VOLUMEN = new Set(['ml', 'cc', 'mililitro', 'mililitros']);
const VOLUMEN_BASE = new Set(['l', 'lt', 'lts', 'litro', 'litros']);

/**
 * Devuelve la unidad en la que se suma y por cuanto hay que multiplicar la cantidad
 * para llegar a ella. Lo que no se reconoce se deja como esta: mejor dos renglones
 * separados que un total inventado.
 */
export function normalizarUnidad(unidad?: string | null): UnidadBase {
  const limpia = (unidad ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (!limpia) return { unidad: 'unidad', factor: 1 };
  if (PESO.has(limpia)) return { unidad: 'kg', factor: 1 / 1000 };
  if (PESO_BASE.has(limpia)) return { unidad: 'kg', factor: 1 };
  if (VOLUMEN.has(limpia)) return { unidad: 'l', factor: 1 / 1000 };
  if (VOLUMEN_BASE.has(limpia)) return { unidad: 'l', factor: 1 };
  return { unidad: limpia, factor: 1 };
}

/**
 * La clave con la que se juntan dos renglones. **La unidad va adentro a proposito:**
 * sin ella, cosas que se miden distinto se suman como si fueran lo mismo.
 */
export function claveDeConsolidado(nombre: string, proveedor: string, unidad?: string | null): string {
  return `${nombre.trim().toLowerCase()}-${proveedor.trim().toLowerCase()}-${normalizarUnidad(unidad).unidad}`;
}

/** Cuanto hay que comprar, ya pasado a la unidad en la que se suma. */
export function cantidadEnUnidadBase(cantidad: number, unidad?: string | null): number {
  return cantidad * normalizarUnidad(unidad).factor;
}

/**
 * Lo que cuesta una unidad base. Si la receta dice "$2 el gramo", el kilo sale $2000:
 * la plata total no cambia, solo la forma de escribirla.
 */
export function costoEnUnidadBase(costoUnitario: number, unidad?: string | null): number {
  const { factor } = normalizarUnidad(unidad);
  if (!factor) return costoUnitario;
  return costoUnitario / factor;
}

/** Como se escribe en pantalla: gramos si es poco, kilos si es mucho. */
export function mostrarCantidad(cantidad: number, unidadBase: string): string {
  const redondear = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));
  if (unidadBase === 'kg' && Math.abs(cantidad) < 1) return `${redondear(cantidad * 1000)} g`;
  if (unidadBase === 'l' && Math.abs(cantidad) < 1) return `${redondear(cantidad * 1000)} ml`;
  return `${redondear(cantidad)} ${unidadBase}`;
}
