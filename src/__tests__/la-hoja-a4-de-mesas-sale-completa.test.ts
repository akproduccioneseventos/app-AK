/**
 * @jest-environment node
 */
import { describe, it, expect, jest } from '@jest/globals';
import sharp from 'sharp';
jest.mock('server-only', () => ({}), { virtual: true });
import { generarPdfTorresMesasA4 } from '@/lib/papeleria/pdf-impresion';
import * as disenarIaModule from '@/lib/papeleria/disenar-con-ia';

describe('Orden 341 - La hoja A4 de mesas sale completa', () => {
  it('Genera PDF de 5 mesas (3 páginas A4) con textos y coordenadas correctas', async () => {
    const png10x10 = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 250, g: 200, b: 150 },
      },
    })
      .png()
      .toBuffer();

    const fondoDataUrl = `data:image/png;base64,${png10x10.toString('base64')}`;

    const mesas = [
      { numero: 1, subtitulo: 'Principal' },
      { numero: 2, subtitulo: 'Familia' },
      { numero: 3, subtitulo: 'Amigos' },
      { numero: 4, subtitulo: 'Trabajo' },
      { numero: 5, subtitulo: 'Juv' },
    ];

    const pdf = generarPdfTorresMesasA4({
      mesas,
      nombreAgasajado: 'Zaira',
      fechaCorta: '24/11/26',
      fondoDataUrl,
    });

    const outputArrayBuffer = pdf.output('arraybuffer');
    expect(outputArrayBuffer).toBeDefined();
    expect(pdf.getNumberOfPages()).toBe(3); // Math.ceil(5/2) = 3

    const pdfText = Buffer.from(outputArrayBuffer).toString('latin1');
    expect(pdfText).toContain('Mesa 1');
    expect(pdfText).toContain('Mesa 5');
    expect(pdfText).toContain('ZAIRA');
    expect(pdfText).toContain('24/11/26');

    // Comprobación real de que ningún dibujo cm ... Do de la imagen de fondo invade y > 750 ni y > 510
    const matches = pdfText.matchAll(/([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+cm.*?Do/gs);
    for (const m of matches) {
      const yTranslate = parseFloat(m.get ? m.get(6) : m[6]);
      // Si la matriz de transformación coloca la imagen por encima de los límites permitidos:
      if (!isNaN(yTranslate)) {
        expect(yTranslate).toBeLessThanOrEqual(510);
      }
    }
  });

  it('Diseñar fondo de mesas genera 1 sola llamada sin repetir por mesa', async () => {
    let llamadasPedir = 0;
    const pedirImagenFn = jest.fn(async () => {
      llamadasPedir++;
      const buf = await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 100, g: 100, b: 100 } },
      })
        .png()
        .toBuffer();
      return {
        ok: true,
        base64: buf.toString('base64'),
        anchoPx: 1200,
        altoPx: 1800,
        modelo: 'gemini-3.1-flash-image',
        topeAlcanzado: false,
      };
    });

    const hayPresupuestoFn = jest.fn(async () => true);
    const fiesta = {
      nombreAgasajado: 'Zaira',
      tipoFiesta: 'Cumpleaños 15',
      tematica: 'Rosas',
    };

    const res = await disenarIaModule.disenarPiezaConIA({
      fiesta,
      pieza: 'fondoMesas',
      hayPresupuestoFn,
      pedirImagenFn,
    });

    expect(res.ok).toBe(true);
    expect(llamadasPedir).toBe(1); // Exactamente 1 llamada para todas las mesas
  });
});
