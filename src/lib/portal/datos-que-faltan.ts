/**
 * Que le falta al portal antes de mandarselo al cliente.
 *
 * Por que existe: este aviso se mostraba DENTRO del portal del cliente, y le
 * hablaba al equipo ("antes de enviarlo al cliente final") en la pantalla del
 * propio cliente. El aviso sirve, pero va donde lo ve quien puede completarlo:
 * la pantalla interna del portal.
 */

export interface DatosDelPortal {
  nombreEvento?: string | null;
  accessKey?: string | null;
  fechaEvento?: string | null;
  tienePresupuesto?: boolean;
}

/** Nombres que el sistema pone solo y que no son un nombre de verdad. */
const NOMBRES_SIN_CONFIGURAR = ['nuevo evento', 'evento sin configurar'];

/** El enlace de ejemplo que viene de fabrica. */
const ENLACE_DE_EJEMPLO = 'cliente1';

/**
 * Devuelve la lista de cosas que faltan, en criollo y en orden de importancia.
 * Lista vacia = el portal esta listo para mandar.
 */
export function datosQueFaltanEnElPortal(datos: DatosDelPortal): string[] {
  const faltan: string[] = [];

  const nombre = (datos.nombreEvento || '').trim();
  if (!nombre || NOMBRES_SIN_CONFIGURAR.includes(nombre.toLowerCase())) {
    faltan.push('El nombre de la fiesta');
  }

  const enlace = (datos.accessKey || '').trim();
  if (!enlace || enlace.toLowerCase() === ENLACE_DE_EJEMPLO) {
    faltan.push('El enlace propio del cliente');
  }

  if (!(datos.fechaEvento || '').trim()) {
    faltan.push('La fecha del evento');
  }

  if (!datos.tienePresupuesto) {
    faltan.push('El presupuesto');
  }

  return faltan;
}
