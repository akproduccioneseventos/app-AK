/**
 * MATAFUEGO - El "Descargar todo" del álbum entrega el formato real y dice la verdad (orden 141).
 *
 * Qué se rompía: un video WebM llegaba al ZIP con nombre `.jpg` (la extensión salía de un pedazo
 * de la dirección), y si todas las descargas fallaban se bajaba un ZIP sin fotos con el cartel
 * "Se empaquetaron N recuerdos" usando la cantidad pedida, no la entregada.
 *
 * Las pruebas principales miran el RESULTADO (nombres dentro del ZIP armado de verdad con JSZip y
 * el resumen que ve la persona); sólo una mira que la pantalla use el ayudante.
 *
 * Probado rompiéndolo: con la extensión forzada a `png/jpg` según `url.includes('.png')` (lo de
 * antes) fallan "WebM", "URL sin extensión" y "consulta con .png"; y con el resumen usando
 * `total` en vez de `agregados` fallan "fallo total" y "parcial".
 */
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {
  bajarRecuerdosParaZip,
  detectarExtension,
  extensionDesdeUrl,
  resumirEntrega,
  type FetchLike,
} from '@/lib/album/armar-zip-del-album';

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
// Cabecera EBML real + doctype "webm"
const WEBM = Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]);
const MP4 = Uint8Array.from([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
const RARO = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

function respuesta(bytes: Uint8Array, mime: string | null, ok = true) {
  return {
    ok,
    headers: { get: (n: string) => (n.toLowerCase() === 'content-type' ? mime : null) },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

function fetchDe(mapa: Record<string, ReturnType<typeof respuesta> | 'falla'>): FetchLike {
  return async (url) => {
    const r = mapa[url];
    if (!r || r === 'falla') throw new Error('sin red');
    return r;
  };
}

async function nombresEnZip(entrega: Awaited<ReturnType<typeof bajarRecuerdosParaZip>>) {
  const zip = new JSZip();
  for (const a of entrega.archivos) zip.file(a.nombre, a.datos);
  const leido = await JSZip.loadAsync(await zip.generateAsync({ type: 'uint8array' }));
  return Object.keys(leido.files).sort();
}

describe('formato real de cada recuerdo', () => {
  it('un video WebM se llama .webm, nunca .jpg', async () => {
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/360.jpg', mediaType: 'video', sourceModule: 'plataforma_360' }],
      fetchDe({ 'https://x/360.jpg': respuesta(WEBM, 'video/webm') }),
    );
    expect(await nombresEnZip(entrega)).toEqual(['recuerdo_1_plataforma_360.webm']);
  });

  it('PNG y JPEG conservan su formato', async () => {
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/a' }, { imageUrl: 'https://x/b' }],
      fetchDe({ 'https://x/a': respuesta(PNG, 'image/png'), 'https://x/b': respuesta(JPEG, 'image/jpeg') }),
    );
    expect(await nombresEnZip(entrega)).toEqual(['recuerdo_1_foto.png', 'recuerdo_2_foto.jpg']);
  });

  it('una dirección de Storage sin extensión usa el tipo MIME', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/b/o/fotos%2F123?alt=media&token=abc';
    expect(detectarExtension({ mime: 'image/webp', url })).toBe('webp');
    expect(detectarExtension({ mime: 'video/mp4; codecs=avc1', url })).toBe('mp4');
  });

  it('la consulta de la dirección no decide: "?alt=media&x=.png" no vuelve PNG a un JPEG', async () => {
    expect(extensionDesdeUrl('https://x/o/foto?alt=media&x=.png')).toBeNull();
    expect(extensionDesdeUrl('https://x/o/foto.jpg?x=.png')).toBe('jpg');
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/o/foto?alt=media&x=.png' }],
      fetchDe({ 'https://x/o/foto?alt=media&x=.png': respuesta(JPEG, 'application/octet-stream') }),
    );
    expect(await nombresEnZip(entrega)).toEqual(['recuerdo_1_foto.jpg']);
  });

  it('sin MIME útil, los primeros bytes deciden', () => {
    expect(detectarExtension({ mime: 'application/octet-stream', datos: WEBM })).toBe('webm');
    expect(detectarExtension({ datos: MP4 })).toBe('mp4');
    expect(detectarExtension({ datos: PNG })).toBe('png');
    const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(detectarExtension({ datos: webp })).toBe('webp');
  });

  it('si el MIME dice imagen pero los bytes son WebM, mandan los bytes', () => {
    expect(detectarExtension({ mime: 'image/jpeg', datos: WEBM })).toBe('webm');
  });

  it('sin forma de saberlo no se inventa extensión y se cuenta aparte', async () => {
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/o/raro' }],
      fetchDe({ 'https://x/o/raro': respuesta(RARO, null) }),
    );
    expect(await nombresEnZip(entrega)).toEqual(['recuerdo_1_foto']);
    expect(entrega.sinFormato).toBe(1);
    expect(resumirEntrega(entrega).descripcion).toMatch(/sin formato reconocible/);
  });
});

describe('el resumen dice lo que entró al ZIP', () => {
  it('fallo total: no hay ZIP y el estado es de fallo', async () => {
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/1' }, { imageUrl: 'https://x/2' }],
      fetchDe({ 'https://x/1': 'falla', 'https://x/2': respuesta(PNG, 'image/png', false) }),
    );
    const r = resumirEntrega(entrega);
    expect(entrega.agregados).toBe(0);
    expect(r.estado).toBe('vacio');
    expect(r.descargarZip).toBe(false);
    expect(r.descripcion).not.toMatch(/empaquetaron/);
  });

  it('parcial: cuenta lo real y los que faltan, y el ZIP sí se baja', async () => {
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/1' }, { imageUrl: 'https://x/2' }, { imageUrl: 'https://x/3' }],
      fetchDe({ 'https://x/1': respuesta(PNG, 'image/png'), 'https://x/2': 'falla', 'https://x/3': 'falla' }),
    );
    const r = resumirEntrega(entrega);
    expect(r.estado).toBe('parcial');
    expect(r.descargarZip).toBe(true);
    expect(r.descripcion).toContain('Se empaquetaron 1 de 3 recuerdos; no se pudieron bajar 2');
    expect(await nombresEnZip(entrega)).toEqual(['recuerdo_1_foto.png']);
  });

  it('completo: dice la cantidad entregada', async () => {
    const entrega = await bajarRecuerdosParaZip(
      [{ imageUrl: 'https://x/1' }, { imageUrl: 'https://x/2' }],
      fetchDe({ 'https://x/1': respuesta(PNG, 'image/png'), 'https://x/2': respuesta(JPEG, 'image/jpeg') }),
    );
    expect(resumirEntrega(entrega).descripcion).toBe('Se empaquetaron 2 recuerdos en un archivo ZIP.');
  });
});

describe('la pantalla usa el ayudante', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/evento/album/[fiestaId]/page.tsx'), 'utf8');
  const cuerpo = fuente.slice(fuente.indexOf('const handleDownloadAll'), fuente.indexOf('const filteredPosts'));

  it('handleDownloadAll arma con el ayudante y no usa posts.length como entregado', () => {
    expect(cuerpo).toContain('bajarRecuerdosParaZip(');
    expect(cuerpo).toContain('resumirEntrega(');
    expect(cuerpo).not.toMatch(/posts\.length/);
    expect(cuerpo).not.toMatch(/['"`]\.?(jpg|png)['"`]|\$\{ext\}/);
  });

  it('con fallo total ofrece reintento', () => {
    expect(fuente).toContain('boton-reintentar-descarga');
  });
});
