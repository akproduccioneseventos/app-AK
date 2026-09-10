import 'server-only';
import type { GeminiImageReference } from '@/lib/ai/gemini-image';

/**
 * LA FOTO QUE SE LE PASA A LA INTELIGENCIA ARTIFICIAL, SIN ABRIR UNA PUERTA.
 *
 * Cuando el equipo manda la foto del salon para que la IA lo decore encima, el
 * servidor tiene que **ir a buscar esa foto**. Y ahi hay un riesgo que no se ve:
 * si se acepta cualquier direccion, se le puede pedir al servidor que traiga algo
 * de adentro de la red -una direccion interna, un servicio de configuracion- y
 * despues eso viaja hacia afuera. Es la forma clasica de sacarle datos a un
 * servidor usandolo de mensajero.
 *
 * Por eso aca **no se acepta cualquier direccion**:
 *
 * - Una foto pegada en el momento (`data:image/...`) se usa tal cual: no sale a
 *   ningun lado.
 * - Una direccion de internet se acepta **solo si es https y de los lugares donde
 *   esta app guarda sus imagenes**. Cualquier otra cosa se descarta en silencio y
 *   la imagen se genera sin foto de referencia, que es lo peor que puede pasar.
 *
 * Y hay un tope de tamano: una foto enorme se descarta antes de mandarla.
 */
const LUGARES_PERMITIDOS = [
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
];

const TOPE_BYTES = 8 * 1024 * 1024;

function esLugarPermitido(host: string): boolean {
  return LUGARES_PERMITIDOS.some((p) => host === p || host.endsWith(`.${p}`));
}

export async function fotoDeReferenciaSegura(
  url: string | undefined,
): Promise<GeminiImageReference | null> {
  if (!url || typeof url !== 'string') return null;

  const dataUrl = url.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
  if (dataUrl) {
    const bytes = Math.floor((dataUrl[2].length * 3) / 4);
    if (bytes > TOPE_BYTES) return null;
    return { base64: dataUrl[2], contentType: dataUrl[1] };
  }

  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    return null;
  }
  if (destino.protocol !== 'https:') return null;
  if (!esLugarPermitido(destino.hostname)) return null;

  try {
    const respuesta = await fetch(destino.toString(), {
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!respuesta.ok) return null;
    const contentType = (respuesta.headers.get('content-type') || '').split(';')[0].trim();
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await respuesta.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > TOPE_BYTES) return null;
    return { base64: buffer.toString('base64'), contentType };
  } catch {
    return null;
  }
}
