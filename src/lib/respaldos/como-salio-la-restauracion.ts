/**
 * COMO SALIO LA RESTAURACION: completa, a medias, o no salio.
 *
 * **Lo encontro Codex el 16 de septiembre de 2026 (BKP03).** La pantalla
 * `/settings/backup` miraba solamente si la respuesta habia llegado bien y anunciaba
 * **"Restauracion Completa"** aunque adentro viniera la lista de los archivos que no
 * entraron; encima recargaba a los 1,5 segundos, tapando cualquier aviso.
 *
 * La decision vive aca, afuera de la pantalla, por dos motivos: se puede probar sin
 * abrir un navegador, y **el que la mire ve las tres salidas juntas** en vez de tener
 * que reconstruirlas leyendo condiciones sueltas.
 */

export type ResultadoDeRestauracion = {
  errors?: unknown;
  skipped?: unknown;
  message?: unknown;
};

export type ComoSalio =
  | { estado: 'completa' }
  | { estado: 'parcial'; faltaron: string[] };

export function comoSalioLaRestauracion(resultado: ResultadoDeRestauracion | null | undefined): ComoSalio {
  const faltaron = Array.isArray(resultado?.errors)
    ? resultado.errors.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (faltaron.length > 0) return { estado: 'parcial', faltaron };
  return { estado: 'completa' };
}

/** Lo que se le dice a la persona, en criollo, segun como salio. */
export function queSeLeDice(como: ComoSalio): { titulo: string; detalle: string; puedeRecargar: boolean } {
  if (como.estado === 'parcial') {
    return {
      titulo: '⚠️ Se restauró sólo una parte',
      detalle: `No se pudo restaurar: ${como.faltaron.join(', ')}. El resto sí quedó. Volvé a intentar con el mismo archivo antes de seguir trabajando.`,
      // No se recarga: la recarga tapa el aviso y la persona sigue sin enterarse.
      puedeRecargar: false,
    };
  }
  return {
    titulo: '✅ Restauración Completa',
    detalle: 'Los datos fueron restaurados. La aplicación se recargará.',
    puedeRecargar: true,
  };
}
