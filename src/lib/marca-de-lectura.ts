import { createHash } from 'crypto';

/**
 * GUARDAR SIN PISAR LO DE OTRO — la marca de lectura (25 de septiembre de 2026).
 *
 * El problema que Codex encontró una y otra vez, en unos 160 lugares: la app lee una lista
 * entera, cambia un renglón y guarda la lista entera. Con dos personas (o dos servidores) a la
 * vez, el que guarda segundo **deshace** lo que cambió el primero y **borra** lo que el primero
 * creó, y las dos pantallas dicen "guardado".
 *
 * Se arregla una vez, en el lugar donde se guarda todo:
 *
 * - Al leer una colección de la base, cada renglón lleva una marca invisible (`_leido`) con su
 *   versión (`v`), su huella (`h`, qué tenía al leerlo) y hasta qué versión se había visto la
 *   colección entera (`w`).
 * - Al guardar la lista entera:
 *   1. **Un renglón que nadie tocó no se vuelve a escribir.** Así no se deshace lo que otro
 *      cambió mientras tanto.
 *   2. **Un renglón que se cambió** se escribe, salvo que en la base haya cambiado desde que se
 *      leyó: eso es un choque, y se avisa en vez de pisar.
 *   3. **Sólo se borra lo que el que guarda llegó a ver.** Lo que otro creó después de la
 *      lectura no se toca.
 *
 * Todo esto es sólo para la base de verdad. El modo local de pruebas no cambia.
 */

export const CLAVE_DE_LA_MARCA = '_leido';
export const MARCA_LECTURA_FALLIDA = Symbol.for('ak.lecturaFallida');

export type MarcaDeLectura = {
  v: string;
  h: string;
  w: string;
  plata?: Record<string, string>;
  campos?: Record<string, string>;
  fallida?: boolean;
};

export function esLecturaFallida(valor: unknown): boolean {
  if (!valor || typeof valor !== 'object') return false;
  if (Boolean((valor as Record<PropertyKey, unknown>)[MARCA_LECTURA_FALLIDA])) return true;
  if (Array.isArray(valor)) {
    return valor.some((item) => Boolean(marcaDe(item)?.fallida));
  }
  return Boolean(marcaDe(valor)?.fallida);
}

/**
 * Marca un dato devuelto por `readData` cuando la base falló o venció el tiempo,
 * para que `decidirGuardado` nunca borre el resto de la colección si el caller
 * agrega un elemento y guarda encima.
 */
export function marcarLecturaFallida<T>(valor: T, motivo?: string): T {
  if (!valor || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    const copia = valor.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item) && !marcaDe(item)) {
        const limpio = sacarMarcas(item);
        return {
          ...item,
          [CLAVE_DE_LA_MARCA]: {
            v: '',
            h: huellaDe(limpio),
            w: '',
            fallida: true,
          } satisfies MarcaDeLectura,
        };
      }
      return item;
    }) as unknown as T;
    Object.defineProperty(copia, MARCA_LECTURA_FALLIDA, {
      value: motivo || true,
      enumerable: false,
      configurable: true,
    });
    return copia;
  }
  const proto = Object.getPrototypeOf(valor);
  const copia = (proto === Object.prototype || proto === null ? { ...(valor as object) } : valor) as T;
  Object.defineProperty(copia, MARCA_LECTURA_FALLIDA, {
    value: motivo || true,
    enumerable: false,
    configurable: true,
  });
  return copia;
}

export class ChoqueAlGuardar extends Error {
  readonly ids: string[];
  constructor(coleccion: string, ids: string[]) {
    super(
      `Otra persona cambió ${ids.length === 1 ? 'este dato' : 'estos datos'} mientras lo editabas`
      + ` (${coleccion}: ${ids.slice(0, 5).join(', ')}). No se guardó para no pisarlo: recargá y probá de nuevo.`,
    );
    this.name = 'ChoqueAlGuardar';
    this.ids = ids;
  }
}

function ordenado(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenado);
  if (valor && typeof valor === 'object') {
    const proto = Object.getPrototypeOf(valor);
    if (proto !== Object.prototype && proto !== null) {
      // Fechas y marcas de tiempo de la base: se comparan por su forma de texto.
      const conJson = valor as { toJSON?: () => unknown };
      return typeof conJson.toJSON === 'function' ? conJson.toJSON() : String(valor);
    }
    const salida: Record<string, unknown> = {};
    for (const clave of Object.keys(valor as Record<string, unknown>).sort()) {
      if (clave === CLAVE_DE_LA_MARCA || clave === '_syncedAt') continue;
      const v = (valor as Record<string, unknown>)[clave];
      if (v === undefined) continue;
      salida[clave] = ordenado(v);
    }
    return salida;
  }
  return valor;
}

/** Qué tiene un renglón, sin la marca ni el sello de la base. Dos renglones iguales dan igual. */
export function huellaDe(item: unknown): string {
  return createHash('sha1').update(JSON.stringify(ordenado(item)) ?? '').digest('hex');
}

/** Saca las marcas de lectura, también de adentro (un renglón copiado dentro de otro). */
export function sacarMarcas<T>(valor: T): T {
  if (Array.isArray(valor)) return valor.map((x) => sacarMarcas(x)) as unknown as T;
  if (valor && typeof valor === 'object') {
    const proto = Object.getPrototypeOf(valor);
    if (proto !== Object.prototype && proto !== null) return valor;
    const salida: Record<string, unknown> = {};
    for (const [clave, v] of Object.entries(valor as Record<string, unknown>)) {
      if (clave === CLAVE_DE_LA_MARCA) continue;
      salida[clave] = sacarMarcas(v);
    }
    return salida as T;
  }
  return valor;
}

/** Pone la marca a cada renglón leído de la base. `docs` trae el dato y su `_syncedAt`. */
export function marcarLectura(docs: Array<{ datos: Record<string, unknown>; version: string }>) {
  const w = docs.reduce((max, d) => (d.version > max ? d.version : max), '');
  return docs.map(({ datos, version }) => ({
    ...datos,
    [CLAVE_DE_LA_MARCA]: { v: version, h: huellaDe(datos), w } satisfies MarcaDeLectura,
  }));
}

export function marcaDe(item: unknown): MarcaDeLectura | null {
  const m = item && typeof item === 'object' ? (item as Record<string, unknown>)[CLAVE_DE_LA_MARCA] : null;
  if (!m || typeof m !== 'object') return null;
  const { v, h, w, plata, campos, fallida } = m as Record<string, unknown>;
  if (typeof v === 'string' && typeof h === 'string' && typeof w === 'string') {
    const res: MarcaDeLectura = { v, h, w };
    if (plata && typeof plata === 'object') res.plata = plata as Record<string, string>;
    if (campos && typeof campos === 'object') res.campos = campos as Record<string, string>;
    if (fallida === true) res.fallida = true;
    return res;
  }
  return null;
}

/**
 * Qué hacer con una lista entera que se quiere guardar, mirando lo que hay en la base.
 * `enLaBase`: id → versión (`_syncedAt`) de cada documento de la colección.
 */
export function decidirGuardado<T>(
  lista: T[],
  idDe: (item: T) => string | null,
  enLaBase: Map<string, string>,
  opciones?: { lecturaFallida?: boolean },
): { escribir: T[]; borrar: string[]; choques: string[]; sinMarcas: boolean } {
  const escribir: T[] = [];
  const choques: string[] = [];
  const idsDeLaLista = new Set<string>();
  let hastaDondeSeVio = '';
  let algunaMarca = false;
  let lecturaFallida = Boolean(opciones?.lecturaFallida || esLecturaFallida(lista));

  for (const item of lista) {
    const id = idDe(item);
    if (id) idsDeLaLista.add(id);
    const marca = marcaDe(item);
    if (!marca) {
      escribir.push(item);
      continue;
    }
    if (marca.fallida) lecturaFallida = true;
    algunaMarca = true;
    if (marca.w > hastaDondeSeVio) hastaDondeSeVio = marca.w;
    if (huellaDe(item) === marca.h) continue; // nadie lo tocó: no se reescribe
    const versionActual = id ? enLaBase.get(id) : undefined;
    if (versionActual !== undefined && versionActual !== marca.v) {
      choques.push(id!);
      continue;
    }
    escribir.push(item);
  }

  const borrar: string[] = [];
  // Si la lectura vino de una base caída o vencida, nunca se borra por omisión el resto de la lista.
  if (!lecturaFallida) {
    for (const [id, version] of enLaBase) {
      if (idsDeLaLista.has(id)) continue;
      // Con marcas: sólo lo que ya estaba cuando se leyó; lo creado o cambiado después es de
      // otro. Sin ninguna marca (una lista armada de cero) se sigue haciendo lo de siempre, para
      // no romper pantallas que reemplazan la lista entera a propósito.
      if (!algunaMarca || version <= hastaDondeSeVio) borrar.push(id);
    }
  }
  return { escribir, borrar, choques, sinMarcas: !algunaMarca };
}

export function marcarItemLectura<T extends Record<string, unknown>>(
  item: T,
  version?: string,
  camposPlata?: readonly string[],
): T & { [CLAVE_DE_LA_MARCA]: MarcaDeLectura } {
  const v = version || String((item as any)._syncedAt ?? (item as any).version ?? '');
  const limpio = sacarMarcas(item);
  const h = huellaDe(limpio);
  const plata: Record<string, string> = {};
  if (camposPlata) {
    for (const campo of camposPlata) {
      plata[campo] = huellaDe((item as Record<string, unknown>)[campo]);
    }
  }
  const campos: Record<string, string> = {};
  for (const clave of Object.keys(limpio)) {
    if (clave === '_syncedAt' || clave === CLAVE_DE_LA_MARCA) continue;
    campos[clave] = huellaDe((limpio as Record<string, unknown>)[clave]);
  }
  return {
    ...item,
    [CLAVE_DE_LA_MARCA]: {
      v: v || h,
      h,
      w: v || h,
      ...(camposPlata ? { plata } : {}),
      campos,
    },
  };
}
