/**
 * Armado del ZIP "Descargar todo" del álbum del cliente/invitado.
 *
 * Lo que fallaba (orden 141):
 *  - Un video WebM llegaba al ZIP con nombre `.jpg`: la extensión se decidía
 *    por un pedazo de la dirección y el resto era `jpg`.
 *  - Si las descargas fallaban todas, se bajaba un ZIP sin fotos y la pantalla
 *    decía "Se empaquetaron N recuerdos" usando la cantidad pedida.
 *
 * Acá vive la lógica pura (formato real + resumen honesto) para poder probarla
 * sin navegador. No transcodifica nada: sólo nombra bien lo que llegó.
 */

export interface RecuerdoParaZip {
  imageUrl?: string;
  mediaType?: 'image' | 'video' | string;
  sourceModule?: string;
}

export interface ArchivoDelZip {
  nombre: string;
  datos: ArrayBuffer;
  /** true si no se pudo determinar el formato real (va sin extensión inventada). */
  sinFormato: boolean;
}

export interface EntregaDelAlbum {
  /** Recuerdos que tenían archivo para bajar. */
  total: number;
  archivos: ArchivoDelZip[];
  /** Cuántos llegaron de verdad al ZIP. */
  agregados: number;
  faltan: number;
  sinFormato: number;
}

export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  headers?: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

const MIME_A_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/ogg': 'ogv',
  'video/x-matroska': 'mkv',
};

const EXTENSIONES_CONOCIDAS = new Set(Object.values(MIME_A_EXTENSION).concat(['jpeg', 'mov']));
const EXTENSIONES_DE_VIDEO = new Set(['webm', 'mp4', 'mov', 'ogv', 'mkv']);

export function extensionDesdeMime(mime: string | null | undefined): string | null {
  if (!mime) return null;
  const limpio = mime.split(';')[0].trim().toLowerCase();
  return MIME_A_EXTENSION[limpio] ?? null;
}

function ascii(bytes: Uint8Array, desde: number, hasta: number): string {
  let s = '';
  for (let i = desde; i < Math.min(hasta, bytes.length); i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/** Mira los primeros bytes del archivo. Devuelve null si no reconoce el formato. */
export function extensionDesdeBytes(datos: ArrayBuffer | Uint8Array): string | null {
  const b = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length >= 4 && ascii(b, 0, 4) === 'GIF8') return 'gif';
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'webp';
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return ascii(b, 0, 64).includes('webm') ? 'webm' : 'mkv';
  }
  if (b.length >= 12 && ascii(b, 4, 8) === 'ftyp') {
    const marca = ascii(b, 8, 12);
    if (marca === 'qt  ') return 'mov';
    if (/^(heic|heix|mif1|msf1)/.test(marca)) return 'heic';
    if (marca === 'avif') return 'avif';
    return 'mp4';
  }
  if (b.length >= 4 && ascii(b, 0, 4) === 'OggS') return 'ogv';
  return null;
}

/** Extensión del PATH de la dirección. La parte `?...` nunca decide. */
export function extensionDesdeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const sinConsulta = url.split('#')[0].split('?')[0];
  let ruta = sinConsulta;
  try {
    ruta = new URL(sinConsulta).pathname;
  } catch {
    // ruta relativa: se usa tal cual
  }
  const ultimo = ruta.split('/').pop() ?? '';
  const punto = ultimo.lastIndexOf('.');
  if (punto < 0) return null;
  const ext = ultimo.slice(punto + 1).toLowerCase();
  if (!EXTENSIONES_CONOCIDAS.has(ext)) return null;
  return ext === 'jpeg' ? 'jpg' : ext;
}

/**
 * Formato real de lo descargado. Orden: tipo MIME de la respuesta, categoría
 * del recuerdo (sólo para descartar una extensión de la dirección que no
 * corresponda), primeros bytes, extensión del path. Si los bytes contradicen
 * al MIME, mandan los bytes: son lo que el cliente va a abrir.
 */
export function detectarExtension(entrada: {
  mime?: string | null;
  mediaType?: string | null;
  datos?: ArrayBuffer | Uint8Array | null;
  url?: string | null;
}): string | null {
  const porMime = extensionDesdeMime(entrada.mime);
  const porBytes = entrada.datos ? extensionDesdeBytes(entrada.datos) : null;
  // Matroska y WebM comparten cabecera: si los bytes no distinguen, vale el tipo declarado.
  if (porBytes === 'mkv' && porMime === 'webm') return 'webm';
  if (porBytes) return porBytes;
  if (porMime) return porMime;
  const porUrl = extensionDesdeUrl(entrada.url);
  if (porUrl) {
    const esVideo = EXTENSIONES_DE_VIDEO.has(porUrl);
    if (entrada.mediaType === 'video' && !esVideo) return null;
    if (entrada.mediaType === 'image' && esVideo) return null;
    return porUrl;
  }
  return null;
}

export function nombreDeRecuerdo(indice: number, sourceModule: string | undefined, ext: string | null): string {
  const base = `recuerdo_${indice + 1}_${sourceModule || 'foto'}`;
  return ext ? `${base}.${ext}` : base;
}

/** Baja cada recuerdo y arma la lista de archivos que de verdad se pueden empaquetar. */
export async function bajarRecuerdosParaZip(
  posts: RecuerdoParaZip[],
  pedir: FetchLike,
): Promise<EntregaDelAlbum> {
  const archivos: ArchivoDelZip[] = [];
  let total = 0;
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post.imageUrl) continue;
    total++;
    try {
      const res = await pedir(post.imageUrl);
      if (!res.ok) continue;
      const datos = await res.arrayBuffer();
      const ext = detectarExtension({
        mime: res.headers?.get('content-type') ?? null,
        mediaType: post.mediaType,
        datos,
        url: post.imageUrl,
      });
      archivos.push({ nombre: nombreDeRecuerdo(i, post.sourceModule, ext), datos, sinFormato: ext === null });
    } catch {
      // un recuerdo que no baja no corta el paquete; se cuenta como faltante
    }
  }
  return {
    total,
    archivos,
    agregados: archivos.length,
    faltan: total - archivos.length,
    sinFormato: archivos.filter((a) => a.sinFormato).length,
  };
}

export interface ResumenDeEntrega {
  estado: 'vacio' | 'parcial' | 'completo';
  /** false cuando no hay nada que descargar: no se entrega un ZIP vacío. */
  descargarZip: boolean;
  titulo: string;
  descripcion: string;
}

/** Lo que se le dice a la persona: siempre la cantidad que entró al ZIP, nunca la pedida. */
export function resumirEntrega(e: Pick<EntregaDelAlbum, 'total' | 'agregados' | 'faltan' | 'sinFormato'>): ResumenDeEntrega {
  const avisoFormato =
    e.sinFormato > 0
      ? ` ${e.sinFormato === 1 ? '1 archivo' : `${e.sinFormato} archivos`} sin formato reconocible: va${e.sinFormato === 1 ? '' : 'n'} sin extensión, abrilo${e.sinFormato === 1 ? '' : 's'} con la app que corresponda.`
      : '';
  if (e.agregados === 0) {
    return {
      estado: 'vacio',
      descargarZip: false,
      titulo: 'No se pudo descargar el álbum',
      descripcion: 'No se pudo bajar ningún recuerdo. Revisá tu conexión y probá de nuevo.',
    };
  }
  if (e.faltan > 0) {
    return {
      estado: 'parcial',
      descargarZip: true,
      titulo: 'Descarga incompleta',
      descripcion: `Se empaquetaron ${e.agregados} de ${e.total} recuerdos; no se pudieron bajar ${e.faltan}. Podés volver a intentar para completar.${avisoFormato}`,
    };
  }
  return {
    estado: 'completo',
    descargarZip: true,
    titulo: '¡Descarga iniciada!',
    descripcion: `Se empaquetaron ${e.agregados} ${e.agregados === 1 ? 'recuerdo' : 'recuerdos'} en un archivo ZIP.${avisoFormato}`,
  };
}
