import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Devuelve un PNG (data URL) del QR dibujado con MÓDULOS ENTEROS: cada cuadradito del código mide
 * exactamente `modulo` píxeles, sin escalar, con `margen` módulos de blanco alrededor.
 *
 * Por qué (orden 147, medido): el QR de pantalla es un canvas de 170 x devicePixelRatio. En un
 * celular (ratio 2,625) el factor no es entero y cada módulo queda con el borde difuminado; además
 * el lector de la app (html5-qrcode) agranda las imágenes chicas con otro factor no entero. El
 * lector real fallaba entre 7% y 14% de los códigos con el canvas copiado. Con módulos enteros de
 * 4 px y 8 módulos de margen leyó 100 de 100 en contenedores de 360 y de 1000 px (299 de 300 en
 * otra tanda). Módulos más grandes (6 u 8 px) leen PEOR: el lector no es sensible al tamaño sino al
 * tamaño final de la imagen, así que no se agranda.
 *
 * El código se genera con el mismo codificador que el QR de pantalla (qrcode.react): se dibuja el
 * SVG fuera de pantalla y se toma su camino (los módulos oscuros, en coordenadas de módulo).
 */
export function qrParaDescargarEntero(valor: string, nivel: 'L' | 'M' | 'Q' | 'H' = 'M', modulo = 4, margen = 8): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(createElement(QRCodeSVG, { value: valor, level: nivel }));
    });
    const svg = host.querySelector('svg');
    const celdas = Number(svg?.getAttribute('viewBox')?.split(' ')[2]);
    const camino = svg?.querySelectorAll('path')[1]?.getAttribute('d');
    if (!svg || !celdas || !camino) throw new Error('No se pudo armar el QR.');
    const lado = (celdas + 2 * margen) * modulo;
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo armar el QR.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = '#000000';
    ctx.translate(margen * modulo, margen * modulo);
    ctx.scale(modulo, modulo);
    ctx.fill(new Path2D(camino));
    return canvas.toDataURL('image/png');
  } finally {
    root.unmount();
  }
}
