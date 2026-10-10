/**
 * @jest-environment node
 */
/**
 * El QR que se baja con "Guardar QR" tiene que leerlo el lector de la app (orden 147).
 *
 * El canvas de pantalla (170 px, sin margen) trae módulos de ~3 px y no siempre lo lee html5-qrcode.
 * Acá se usa el PNG REAL que falló en el lector (docs/evidencias/94-artifactos/qr-reentrada-original.png)
 * y códigos de otros largos, se arma el archivo con `qrParaDescargar` y se lo decodifica con el mismo
 * decodificador que trae html5-qrcode (ZXing, corre en Node). Se mira el RESULTADO: el texto decodificado
 * es idéntico al original, hay zona blanca de 4 módulos o más, y el módulo mide un número entero de píxeles.
 *
 * Probado rompiéndolo: (1) dejar `zonaEnModulos` en 0 puso en rojo la prueba de la zona blanca;
 * (2) hacer que `qrParaDescargar` devuelva el canvas de origen sin tocar puso en rojo la zona blanca
 * y el tamaño; (3) cambiar el centro de muestreo por la esquina del módulo (`+ 0.5` → `+ 0`) dejó
 * módulos corridos y puso en rojo la decodificación; (4) sacar el uso en `downloadQR` puso en rojo
 * la comprobación del código fuente. Se restauró todo.
 */
import fs from 'fs';
import zlib from 'zlib';
import { conZonaBlanca, leerModulos, qrParaDescargar, type CanvasLike } from '@/lib/qr/qr-para-descargar';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const zxing = require('html5-qrcode/third_party/zxing-js.umd');

/** Canvas de mentira con píxeles de verdad (gris + alfa) para poder leerlos y decodificarlos. */
function canvasDePixeles(w: number, h: number, rgba?: Uint8ClampedArray): CanvasLike & { rgba: Uint8ClampedArray } {
  const datos = rgba || new Uint8ClampedArray(w * h * 4);
  const lienzo: any = { width: w, height: h, rgba: datos };
  const ctx: any = {
    fillStyle: '#fff',
    imageSmoothingEnabled: true,
    fillRect(x: number, y: number, ancho: number, alto: number) {
      const v = ctx.fillStyle === '#000000' ? 0 : 255;
      for (let j = y; j < y + alto; j++) for (let i = x; i < x + ancho; i++) {
        const k = (j * w + i) * 4;
        datos[k] = datos[k + 1] = datos[k + 2] = v; datos[k + 3] = 255;
      }
    },
    drawImage(origen: any, x: number, y: number, ancho: number, alto: number) {
      for (let j = 0; j < alto; j++) for (let i = 0; i < ancho; i++) {
        const sx = Math.floor((i * origen.width) / ancho), sy = Math.floor((j * origen.height) / alto);
        const s = (sy * origen.width + sx) * 4, d = ((y + j) * w + x + i) * 4;
        for (let q = 0; q < 4; q++) datos[d + q] = origen.rgba[s + q];
      }
    },
    getImageData: () => ({ data: datos }),
  };
  lienzo.getContext = () => ctx;
  return lienzo;
}
const fabrica = (a: number, b: number) => canvasDePixeles(a, b);

function leerPng(buf: Buffer) {
  let p = 8, w = 0, h = 0; const idat: Buffer[] = [];
  while (p < buf.length) {
    const l = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + l);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); }
    if (t === 'IDAT') idat.push(d);
    p += 12 + l;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), st = w * 4, out = new Uint8ClampedArray(h * st);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)];
    for (let x = 0; x < st; x++) {
      const r = raw[y * (st + 1) + 1 + x], a = x >= 4 ? out[y * st + x - 4] : 0, b = y ? out[(y - 1) * st + x] : 0, c = x >= 4 && y ? out[(y - 1) * st + x - 4] : 0;
      let v: number;
      if (f === 0) v = r; else if (f === 1) v = r + a; else if (f === 2) v = r + b; else if (f === 3) v = r + ((a + b) >> 1);
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = r + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[y * st + x] = v & 255;
    }
  }
  return canvasDePixeles(w, h, out);
}

function decodificar(c: CanvasLike & { rgba: Uint8ClampedArray }): string {
  const gris = new Uint8ClampedArray(c.width * c.height);
  for (let i = 0; i < gris.length; i++) gris[i] = Math.round(0.299 * c.rgba[i * 4] + 0.587 * c.rgba[i * 4 + 1] + 0.114 * c.rgba[i * 4 + 2]);
  const bitmap = new zxing.BinaryBitmap(new zxing.HybridBinarizer(new zxing.RGBLuminanceSource(gris, c.width, c.height)));
  return new zxing.QRCodeReader().decode(bitmap).getText();
}

/** Un QR de pantalla como lo dibuja qrcode.react: 170 px, sin margen, módulos con borde suavizado. */
function qrDePantalla(texto: string, lado = 170) {
  const hints = new Map(); hints.set(zxing.EncodeHintType.ERROR_CORRECTION, zxing.QRCodeDecoderErrorCorrectionLevel.H); hints.set(zxing.EncodeHintType.MARGIN, 0);
  const m = new zxing.QRCodeWriter().encode(texto, zxing.BarcodeFormat.QR_CODE, 0, 0, hints);
  const n = m.getWidth();
  const c = canvasDePixeles(lado, lado);
  const datos = c.rgba;
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
    // Promedio de lo que cubre el píxel: así quedan bordes grises como en un canvas real.
    const x0 = (x * n) / lado, x1 = ((x + 1) * n) / lado, y0 = (y * n) / lado, y1 = ((y + 1) * n) / lado;
    let suma = 0, area = 0;
    for (let j = Math.floor(y0); j < Math.ceil(y1); j++) for (let i = Math.floor(x0); i < Math.ceil(x1); i++) {
      const a = (Math.min(i + 1, x1) - Math.max(i, x0)) * (Math.min(j + 1, y1) - Math.max(j, y0));
      suma += a * (m.get(i, j) ? 0 : 255); area += a;
    }
    const v = Math.round(suma / area), k = (y * lado + x) * 4;
    datos[k] = datos[k + 1] = datos[k + 2] = v; datos[k + 3] = 255;
  }
  return { canvas: c, modulos: n };
}

const PNG_QUE_FALLO = 'docs/evidencias/94-artifactos/qr-reentrada-original.png';
const TEXTO_PNG = 'http://127.0.0.1:3300/evento/accesos/q92rmv2yk9b9?fiestaId=q92rmv2yk9b9&token=qa92tokenmv2yk9b9&guestId=gq92rmv2yk9b9';

/** Cuántos píxeles de blanco hay entre el borde del archivo y el primer píxel oscuro. */
function margenBlanco(c: CanvasLike & { rgba: Uint8ClampedArray }) {
  for (let x = 0; x < c.width; x++) for (let y = 0; y < c.height; y++) if (c.rgba[(y * c.width + x) * 4] < 128) return x;
  return -1;
}

describe('el QR descargado', () => {
  it('el PNG real que falló en el lector sale con módulos enteros, zona blanca de 4+ módulos y se decodifica igual', () => {
    const original = leerPng(fs.readFileSync(PNG_QUE_FALLO));
    const grilla = leerModulos(original)!;
    expect(grilla.length).toBe(57);
    const salida = qrParaDescargar(original, { crearCanvas: fabrica }) as ReturnType<typeof canvasDePixeles>;
    const px = salida.width / (57 + 8);
    expect(Number.isInteger(px)).toBe(true); // módulo de tamaño entero
    expect(px).toBeGreaterThanOrEqual(8);
    expect(salida.width).toBeGreaterThanOrEqual(600);
    expect(margenBlanco(salida)).toBeGreaterThanOrEqual(4 * px); // zona blanca de 4 módulos
    expect(decodificar(salida)).toBe(TEXTO_PNG);
  });

  it.each([
    ['corto', 'https://ak.uy/i/abc'],
    ['mediano', 'https://app.example.com/evento/accesos/f123?fiestaId=f123&token=abcdef0123456789&guestId=g1'],
    ['largo', 'http://127.0.0.1:3300/evento/accesos/q92?fiestaId=q92&token=' + 'x'.repeat(60) + '&guestId=g' + 'y'.repeat(30)],
  ])('un código %s se reconstruye y se decodifica idéntico', (_n, texto) => {
    const { canvas, modulos } = qrDePantalla(texto);
    expect(leerModulos(canvas)!.length).toBe(modulos);
    const salida = qrParaDescargar(canvas, { crearCanvas: fabrica }) as ReturnType<typeof canvasDePixeles>;
    expect(margenBlanco(salida)).toBeGreaterThanOrEqual(4 * (salida.width / (modulos + 8)));
    expect(decodificar(salida)).toBe(texto);
  });

  it('si el canvas no se entiende, el respaldo agranda por un entero y deja borde blanco (nunca el canvas pelado)', () => {
    const raro = canvasDePixeles(170, 170); // todo vacío: no hay código que interpretar
    expect(leerModulos(raro)).toBeNull();
    const salida = qrParaDescargar(raro, { crearCanvas: fabrica }) as ReturnType<typeof canvasDePixeles>;
    expect(salida).not.toBe(raro);
    expect(salida.width).toBeGreaterThan(170 * 3);
    const directo = conZonaBlanca(raro, { crearCanvas: fabrica });
    expect(directo.width).toBe(170 * 4 + 2 * 32 * 4);
  });

  it('"Guardar QR" del portal del invitado y de la confirmación bajan el archivo armado, no el canvas pelado', () => {
    for (const ruta of ['src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx', 'src/app/invitacion/[fiestaId]/rsvp/page.tsx']) {
      const fuente = fs.readFileSync(ruta, 'utf8');
      const cuerpo = fuente.slice(fuente.indexOf('const downloadQR'));
      const hasta = cuerpo.indexOf('};');
      const funcion = cuerpo.slice(0, hasta);
      expect(funcion).toContain('qrParaDescargar(canvas)');
      expect(funcion).not.toMatch(/canvas\.toDataURL/);
    }
  });
});
