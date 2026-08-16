/**
 * Elige la foto grande con la que abre el portal del cliente.
 *
 * Por que existe: el portal es la pantalla mas importante que ve el cliente y
 * abria con un degradado gris liso. Una plataforma paga abre con una imagen que
 * emociona. Cuando la fiesta no tiene foto cargada, en vez de dejar el gris se
 * usa una del catalogo propio segun el tipo de evento.
 *
 * El orden manda: primero lo que sea de ESA fiesta (foto del protagonista, de la
 * invitacion, del salon). Solo si no hay nada de eso se cae al catalogo.
 */

/**
 * Fotos genericas de AK, una por familia de evento.
 *
 * Son archivos propios de la app, no enlaces a otro sitio: una foto externa
 * puede tardar, fallar o desaparecer, y la portada del cliente quedaria gris
 * justo en la pantalla que mas importa.
 */
export const FOTOS_DE_PORTADA_POR_TIPO: Record<string, string> = {
  quinceanera: '/media/catalogo-servicios/quinceanera_hero.png',
  casamiento: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg',
  cumpleanos: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
  infantil: '/media/catalogo-servicios/candy-bar-xv-luces-04.jpeg',
  empresarial: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
  graduacion: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
};

/** La que se usa cuando el tipo de evento no dice nada util. */
export const FOTO_DE_PORTADA_GENERICA = '/media/catalogo-servicios/quinceanera_hero.png';

/**
 * Saca acentos y mayusculas para poder comparar "Quinceañera", "QUINCE AÑOS" y
 * "quinceanera" como lo mismo.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Devuelve la foto del catalogo que corresponde al tipo de evento. */
export function fotoDePortadaPorTipo(tipoEvento?: string | null): string {
  const tipo = normalizar(tipoEvento || '');
  if (!tipo) return FOTO_DE_PORTADA_GENERICA;

  // 'XV' es como se escribe el tipo mas comun del negocio y se estaba cayendo
  // a la foto generica.
  if (tipo.includes('15') || tipo.includes('quince') || tipo === 'xv' || tipo.startsWith('xv ')) {
    return FOTOS_DE_PORTADA_POR_TIPO.quinceanera;
  }
  if (tipo.includes('18')) return FOTOS_DE_PORTADA_POR_TIPO.cumpleanos;
  if (tipo.includes('casamiento') || tipo.includes('boda')) return FOTOS_DE_PORTADA_POR_TIPO.casamiento;
  if (tipo.includes('infantil') || tipo.includes('nino')) return FOTOS_DE_PORTADA_POR_TIPO.infantil;
  if (tipo.includes('empresa') || tipo.includes('corporativ')) return FOTOS_DE_PORTADA_POR_TIPO.empresarial;
  if (tipo.includes('graduacion') || tipo.includes('egresad')) return FOTOS_DE_PORTADA_POR_TIPO.graduacion;
  if (tipo.includes('cumple')) return FOTOS_DE_PORTADA_POR_TIPO.cumpleanos;

  return FOTO_DE_PORTADA_GENERICA;
}

/**
 * La foto definitiva de la portada. `candidatas` va de la mas propia de esa
 * fiesta a la menos, y el catalogo queda siempre como ultimo recurso: el portal
 * nunca abre sin imagen.
 */
export function elegirFotoDePortada(
  candidatas: Array<string | null | undefined>,
  tipoEvento?: string | null
): string {
  const propia = candidatas.find(url => typeof url === 'string' && url.trim().length > 0);
  return propia?.trim() || fotoDePortadaPorTipo(tipoEvento);
}
