/**
 * @jest-environment node
 */
import { describe, it, expect, jest } from '@jest/globals';
import sharp from 'sharp';
jest.mock('server-only', () => ({}), { virtual: true });
import {
  obtenerVentanasFotocabina,
  procesarMarcoVerdeATransparente,
} from '@/lib/papeleria/disenar-con-ia';

describe('Orden 341 - El marco con IA deja las ventanas transparentes', () => {
  it('Pinta las ventanas de verde puro #00FF00 y verifica que quedan transparentes alpha === 0, fuera alpha === 255', async () => {
    const ancho = 1200;
    const alto = 1800;
    const ventanas = obtenerVentanasFotocabina('strip_3');

    // Creamos base violeta sólido (RGBA)
    const baseRaw = Buffer.alloc(ancho * alto * 4);
    for (let i = 0; i < baseRaw.length; i += 4) {
      baseRaw[i] = 128;     // R
      baseRaw[i + 1] = 0;   // G
      baseRaw[i + 2] = 128; // B
      baseRaw[i + 3] = 255; // A
    }

    // Pintar las 3 ventanas de verde puro #00FF00
    for (const v of ventanas) {
      const vXMin = Math.round(v.xMin * ancho);
      const vXMax = Math.round(v.xMax * ancho);
      const vYMin = Math.round(v.yMin * alto);
      const vYMax = Math.round(v.yMax * alto);

      for (let y = vYMin; y < vYMax; y++) {
        for (let x = vXMin; x < vXMax; x++) {
          const idx = (y * ancho + x) * 4;
          baseRaw[idx] = 0;       // R
          baseRaw[idx + 1] = 255; // G
          baseRaw[idx + 2] = 0;   // B
          baseRaw[idx + 3] = 255; // A
        }
      }
    }

    const pngBufferInput = await sharp(baseRaw, {
      raw: { width: ancho, height: alto, channels: 4 },
    })
      .png()
      .toBuffer();

    const resultado = await procesarMarcoVerdeATransparente(pngBufferInput, 'strip_3');

    expect(resultado.ventanasOk).toBe(true);

    const { data: rawOut, info } = await sharp(resultado.pngBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Verificar centro de las ventanas -> alpha === 0
    for (const v of ventanas) {
      const centroX = Math.round((v.xMin + v.xMax) / 2 * ancho);
      const centroY = Math.round((v.yMin + v.yMax) / 2 * alto);
      const idxCentro = (centroY * info.width + centroX) * 4;
      expect(rawOut[idxCentro + 3]).toBe(0);
    }

    // Verificar borde/pie fuera de ventanas -> alpha === 255
    const fueraX1 = 10;
    const fueraY1 = 10;
    const idxFuera1 = (fueraY1 * info.width + fueraX1) * 4;
    expect(rawOut[idxFuera1 + 3]).toBe(255);

    const fueraX2 = 600;
    const fueraY2 = 1600;
    const idxFuera2 = (fueraY2 * info.width + fueraX2) * 4;
    expect(rawOut[idxFuera2 + 3]).toBe(255);
  });

  it('Si la imagen no tiene las ventanas verdes esperadas, ventanasOk is false', async () => {
    const ancho = 1200;
    const alto = 1800;
    const baseRaw = Buffer.alloc(ancho * alto * 4, 255); // Todo blanco opaco

    const pngBufferInput = await sharp(baseRaw, {
      raw: { width: ancho, height: alto, channels: 4 },
    })
      .png()
      .toBuffer();

    const resultado = await procesarMarcoVerdeATransparente(pngBufferInput, 'strip_3');
    expect(resultado.ventanasOk).toBe(false);
  });
});
