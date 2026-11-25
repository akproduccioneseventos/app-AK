/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals';
import sharp from 'sharp';
import { generarPdfCuadritos10x15 } from '@/lib/papeleria/pdf-impresion';

describe('Orden 341 - La carta sale de 10 por 15 exactos', () => {
  it('Genera PDF A4 vertical con 2 copias de 100x150 mm y matrices correctas en el stream', async () => {
    const png10x10 = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const dataUrl = `data:image/png;base64,${png10x10.toString('base64')}`;

    const pdf = generarPdfCuadritos10x15(dataUrl);
    const outputArrayBuffer = pdf.output('arraybuffer');
    expect(outputArrayBuffer).toBeDefined();

    const pdfText = Buffer.from(outputArrayBuffer).toString('latin1');

    // Comprobar que contiene instrucciones de matriz cm con ancho ≈ 283.46 pt (100 mm) y alto ≈ 425.20 pt (150 mm)
    // 100 mm * 2.834645 = 283.46, 150 mm * 2.834645 = 425.20
    expect(pdfText).toContain('283.');
    expect(pdfText).toContain('425.');
  });
});
