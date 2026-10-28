import 'server-only';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const MAX_BYTES = 8 * 1024 * 1024;
export async function loadDecorationPhoto(source: string): Promise<Buffer> {
  const url = new URL(source, 'https://akproducciones.uy');
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Foto no permitida.');
  let bytes: Buffer;
  if (['akproducciones.uy', 'www.akproducciones.uy'].includes(url.hostname)) {
    const decoded = decodeURIComponent(url.pathname);
    if (!decoded.startsWith('/media/') || decoded.includes('..') || decoded.includes('\\') || decoded.includes('\0')) throw new Error('Ruta de foto invalida.');
    const root = await realpath(path.join(process.cwd(), 'public', 'media'));
    const file = await realpath(path.join(process.cwd(), 'public', decoded));
    if (!file.startsWith(root + path.sep)) throw new Error('Foto fuera del catalogo.');
    const { stat } = await import('node:fs/promises');
    if ((await stat(file)).size > MAX_BYTES) throw new Error('Foto demasiado grande.');
    bytes = await readFile(file);
  } else {
    const host = url.hostname;
    const permitted = host === 'storage.googleapis.com' || host === 'firebasestorage.googleapis.com' ||
      host.endsWith('.cdninstagram.com') || host.endsWith('.fbcdn.net');
    if (!permitted) throw new Error('La foto debe estar en el catalogo, Meta o el almacenamiento de la app.');
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok || !/^image\/(png|jpeg|webp)(;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('No se pudo leer la foto original.');
    if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Foto demasiado grande.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Foto vacia.');
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BYTES) throw new Error('Foto demasiado grande.');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => undefined); }
    bytes = Buffer.concat(chunks);
  }
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Foto vacia o demasiado grande.');
  // Decode before the model: reject markup, decompression bombs and fake image extensions.
  return sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize(1280, 1280, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
}
