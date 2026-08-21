/**
 * Los identificadores de medición de AK Producciones.
 *
 * **Los dos son públicos por diseño, y no son claves.** Viajan en el código de
 * cada página que carga cualquier visitante, igual que el teléfono en el pie. No
 * dan acceso a nada: sólo dicen a qué cuenta mandar las visitas.
 *
 * ## Por qué están escritos acá y no sólo como variable del servidor
 *
 * Estaban únicamente como variable del servidor, y por eso **no se midió nunca**:
 * el dueño no programa y no podía cargarlas. Escritos acá, la medición funciona
 * sola desde el primer despliegue, sin que nadie toque una consola.
 *
 * La variable del servidor sigue mandando cuando está puesta, para poder apuntar
 * a otra cuenta sin tocar el código.
 *
 * **Lo que NO va nunca en este archivo:** cualquier cosa que dé acceso a algo. La
 * llave de cobros, los permisos de publicar, las claves de servicio. Ésas no son
 * identificadores: son llaves, y ya se coló una vez.
 */

/** Google Analytics 4: a qué cuenta se mandan las visitas de la web. */
export const ID_DE_MEDICION_GOOGLE = 'G-KBNKPZ02N9';

/** Meta: con qué píxel se miden los anuncios de Facebook e Instagram. */
export const ID_DEL_PIXEL_META = '898109993002064';

/** El que manda: la variable del servidor si está, y si no el de la empresa. */
export function idDeMedicionGoogle(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ID_DE_MEDICION_GOOGLE;
}

export function idDelPixelMeta(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || ID_DEL_PIXEL_META;
}
