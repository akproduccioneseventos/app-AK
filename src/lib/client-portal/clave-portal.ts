import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * La clave con la que el cliente entra a su portal.
 *
 * Al principio le damos una armada con su propio nombre, para que la recuerde sin
 * anotarla en ningun lado. Esa clave es comoda pero adivinable, asi que el portal
 * lo obliga a cambiarla la primera vez que entra. A partir de ahi la clave es suya
 * y AK no la conoce.
 */

const LARGO_MINIMO = 6;

function soloLetrasYNumeros(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Arma la clave inicial: CLIENTE + nombre + apellido.
 * Por ejemplo, para Maria Gonzalez queda CLIENTEMARIAGONZALEZ.
 */
export function construirClavePorDefecto(
  fiesta: Pick<FiestaEnPlanificacion, 'configuracion' | 'id'> | null | undefined,
): string {
  const nombre = soloLetrasYNumeros(String(fiesta?.configuracion?.clienteNombre ?? ''));
  if (nombre) return `CLIENTE${nombre}`;

  // Sin nombre del cliente cargado no hay con que armarla. Se usa el codigo del
  // evento para que igual haya una clave y el portal no quede sin llave.
  const codigo = soloLetrasYNumeros(String(fiesta?.id ?? '')).slice(-6);
  return codigo ? `CLIENTE${codigo}` : '';
}

/**
 * Dice si la clave guardada sigue siendo la que le dimos nosotros.
 *
 * Se mira el dato explicito primero: una vez que el cliente eligio la suya, no
 * importa si por casualidad se parece a la inicial. Para las fiestas viejas, que
 * no tienen ese dato, se compara contra la clave armada con su nombre.
 */
export function claveEsLaInicial(
  fiesta: Pick<FiestaEnPlanificacion, 'configuracion' | 'id' | 'clientPortalSettings'> | null | undefined,
): boolean {
  const settings = fiesta?.clientPortalSettings;
  if (!settings) return false;
  if (settings.claveCambiadaPorCliente) return false;

  const guardada = String(settings.accessKey ?? '').trim();
  if (!guardada) return false;

  const inicial = construirClavePorDefecto(fiesta);
  if (!inicial) return false;

  return guardada.toUpperCase() === inicial.toUpperCase();
}

/**
 * Reglas de la clave nueva. Devuelve el motivo del rechazo, o null si esta bien.
 *
 * Se piden pocas cosas a proposito: quien la usa es el cliente, no una persona
 * tecnica, y una regla complicada termina en un papelito pegado a la heladera.
 */
export function motivoClaveInvalida(
  claveNueva: string,
  fiesta: Pick<FiestaEnPlanificacion, 'configuracion' | 'id'> | null | undefined,
): string | null {
  const limpia = String(claveNueva ?? '').trim();

  if (limpia.length < LARGO_MINIMO) {
    return `La clave tiene que tener al menos ${LARGO_MINIMO} caracteres.`;
  }
  if (/^\s|\s$/.test(claveNueva ?? '')) {
    return 'La clave no puede empezar ni terminar con un espacio.';
  }
  if (limpia.toUpperCase() === construirClavePorDefecto(fiesta).toUpperCase()) {
    return 'Elegí una clave distinta a la que te dimos al principio.';
  }
  if (/^[0-9]+$/.test(limpia)) {
    return 'La clave no puede ser solo números.';
  }

  return null;
}

/**
 * Deja a la vista solo lo suficiente del correo para que el cliente reconozca
 * cual es, sin publicar la direccion entera en pantalla.
 */
export function taparCorreo(correo: string | undefined | null): string {
  const valor = String(correo ?? '').trim();
  const arroba = valor.indexOf('@');
  if (arroba <= 0) return '';

  const usuario = valor.slice(0, arroba);
  const dominio = valor.slice(arroba);
  const visible = usuario.slice(0, Math.min(2, usuario.length));
  return `${visible}${'*'.repeat(Math.max(3, usuario.length - visible.length))}${dominio}`;
}
