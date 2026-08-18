import type { ModuloPermiso } from '@/types/acceso-personal';

/**
 * Que modulos puede abrir de verdad alguien que entra con un enlace de
 * colaborador, sin cuenta.
 *
 * **Por que existe esta lista.** El portal ofrecia quince modulos y solo estos
 * seis funcionan. Los otros nueve -prospectos, presupuestos, clientes,
 * facturacion, personal, proveedores, empresa, contabilidad y calendario- se
 * enlazaban **sin la llave del enlace**, apuntaban a pantallas internas, y abrir
 * el enlace del colaborador **no le da ninguna sesion**: el que tocaba el boton
 * caia en la pantalla de ingreso.
 *
 * **Por que se sacaron en vez de abrirlos.** Abrirlos de verdad significaba
 * dejar entrar con un enlace, y sin cuenta, a la contabilidad, las facturas, la
 * base de clientes y el personal. Un enlace se reenvia por WhatsApp sin pensar.
 * Los seis que quedan son los del evento -lo que el fotografo, el DJ o el
 * catering necesitan- y esos si llevan la llave, que se comprueba contra la
 * fiesta con `verifyAccesoPersonalToken`.
 *
 * Si algun dia se quiere abrir alguno de los nueve, no alcanza con volver a
 * ponerlo aca: hay que hacer que esa pantalla acepte y compruebe la llave, como
 * ya hacen las del evento.
 */
export const MODULOS_QUE_ANDAN_POR_ENLACE: readonly ModuloPermiso[] = [
  'musica',
  'itinerario',
  'carga-operativa',
  'decoracion',
  'reposteria',
  'fotografia',
] as const;

export function andaPorEnlace(permiso: ModuloPermiso): boolean {
  return MODULOS_QUE_ANDAN_POR_ENLACE.includes(permiso);
}
