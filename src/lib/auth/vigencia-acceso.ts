import type { AccesoPersonal } from '@/types/acceso-personal';

/**
 * Cuánto dura un acceso de proveedor cuando no se le puso fecha propia.
 * Noventa días cubre de sobra la ventana entre que se contrata un proveedor y
 * se entrega el material de la fiesta.
 *
 * Vive acá y no en `accesos-personal.ts` porque ese archivo es `'use server'` y
 * sólo puede exportar funciones asíncronas: hay una prueba que lo controla.
 */
export const DIAS_DE_VIGENCIA_POR_DEFECTO = 90;

/**
 * Un enlace de proveedor no puede servir para siempre: el fotógrafo de una
 * fiesta de hace ocho meses seguía entrando. Los accesos ya guardados no tienen
 * fecha de vencimiento, por eso se les cuenta la ventana desde la creación.
 *
 * Ante una fecha ilegible NO se bloquea: dejar afuera al proveedor el día de la
 * fiesta es peor que darle un rato de más.
 */
export function accesoVencido(acceso: AccesoPersonal, ahora: Date = new Date()): boolean {
  if (acceso.fechaVencimiento) {
    const vence = new Date(acceso.fechaVencimiento);
    return Number.isFinite(vence.getTime()) ? ahora > vence : false;
  }

  const creado = new Date(acceso.fechaCreacion);
  if (!Number.isFinite(creado.getTime())) return false;

  const limite = new Date(creado);
  limite.setDate(limite.getDate() + DIAS_DE_VIGENCIA_POR_DEFECTO);
  return ahora > limite;
}
