import { TIPOS_FIESTA_CATALOGO, type TipoFiestaCatalogo } from '@/types/catalogo';

/**
 * De qué tipo de fiesta buscar las fotos en la galería.
 *
 * **El problema que resuelve.** La presentación y la galería no llaman igual a las
 * mismas cosas: la presentación dice "Empresarial" y la galería dice "Corporativo";
 * la presentación dice "Cumpleaños infantil" con minúscula y la galería
 * "Cumpleaños Infantil". Buscar tal cual no traía **ninguna** foto, y la pantalla
 * quedaba vacía sin que nadie entendiera por qué: no falla, simplemente no aparece
 * nada.
 *
 * Por eso la traducción vive acá, en un solo lugar y probada. Si mañana se agrega
 * un tipo de fiesta, se suma una línea.
 *
 * Sirve sobre todo para los tipos de fiesta que **no tienen catálogo impreso**,
 * como los infantiles y los empresariales: las fotos salen de las que el equipo ya
 * subió a la galería, así que cada fiesta que se hace mejora la presentación sola.
 */

/** Cómo se escribe cada tipo, sin acentos ni mayúsculas, y a qué tipo de galería va. */
const EQUIVALENCIAS: Array<{ claves: string[]; galeria: TipoFiestaCatalogo }> = [
  { claves: ['casamiento', 'boda', 'bodas'], galeria: 'Casamiento' },
  { claves: ['15 anos', 'xv anos', 'xv', 'quince', 'quinceanera', 'cumpleanos 15'], galeria: 'XV Años' },
  { claves: ['cumpleanos infantil', 'infantil', 'infantiles', 'cumpleanos de nino'], galeria: 'Cumpleaños Infantil' },
  { claves: ['cumpleanos adultos', 'cumpleanos adulto', 'cumpleanos'], galeria: 'Cumpleaños Adulto' },
  { claves: ['empresarial', 'empresariales', 'corporativo', 'corporativos', 'empresa'], galeria: 'Corporativo' },
  { claves: ['bautismo', 'bautizo'], galeria: 'Bautismo' },
  { claves: ['comunion'], galeria: 'Comunión' },
  { claves: ['graduacion', 'egresados'], galeria: 'Graduación' },
  { claves: ['aniversario', 'aniversarios'], galeria: 'Aniversario' },
];

export function normalizar(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Devuelve el tipo de la galería, o `null` si no se puede saber con certeza.
 *
 * Cuando devuelve `null`, quien llama tiene que mostrar las fotos generales: es
 * mejor una foto linda de otra fiesta que una pantalla vacía.
 */
export function tipoDeGaleriaPara(tipoFiesta: string | undefined | null): TipoFiestaCatalogo | null {
  const limpio = normalizar(tipoFiesta ?? '');
  if (!limpio) return null;

  // Primero, el nombre exacto de la galería (por si ya viene bien escrito).
  const exacto = TIPOS_FIESTA_CATALOGO.find((tipo) => normalizar(tipo) === limpio);
  if (exacto) return exacto;

  // Después, las equivalencias. Se busca la clave más larga que encaje, para que
  // "cumpleanos infantil" no se lo lleve "cumpleanos".
  let mejor: { largo: number; galeria: TipoFiestaCatalogo } | null = null;
  for (const { claves, galeria } of EQUIVALENCIAS) {
    for (const clave of claves) {
      if (limpio === clave || limpio.includes(clave)) {
        if (!mejor || clave.length > mejor.largo) mejor = { largo: clave.length, galeria };
      }
    }
  }

  return mejor?.galeria ?? null;
}
