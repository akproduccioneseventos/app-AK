/** @jest-environment jsdom */

/**
 * Orden 265 — Fotocabina, el boomerang espera a que carguen las fotos antes de dibujar.
 *
 * Verifica que al procesar los cuadros del boomerang para fotocabina:
 * 1. Se invoca y espera `img.decode()` en cada imagen de la tanda antes de `drawImage`.
 * 2. Si no se espera `decode()` o la imagen no está decodificada, los datos del cuadro
 *    quedan incompletos o vacíos.
 * 3. Con `await img.decode()` se garantiza que cada cuadro se dibuja con la imagen completa.
 * 4. La página real `src/app/evento/fotocabina/[fiestaId]/page.tsx` espera `await img.decode()`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { procesarCuadrosBoomerang } from '@/lib/entretenimiento/tira-fotocabina';

describe('La fotocabina boomerang espera las fotos (Orden 265)', () => {
  let createdCanvases: any[] = [];
  let drawImageEvents: Array<{ src: string; isDecoded: boolean; timestamp: number }> = [];
  let decodeEvents: Array<{ src: string; timestamp: number }> = [];

  class MockHTMLImageElement {
    src = '';
    decoded = false;
    decodeCount = 0;

    decode = jest.fn(async () => {
      this.decodeCount++;
      // Simula el tiempo que tarda el motor del navegador en decodificar la imagen
      await new Promise((resolve) => setTimeout(resolve, 20));
      this.decoded = true;
      decodeEvents.push({ src: this.src, timestamp: Date.now() });
    });
  }

  beforeEach(() => {
    createdCanvases = [];
    drawImageEvents = [];
    decodeEvents = [];

    // Mock de Image global en jsdom
    (global as any).Image = MockHTMLImageElement;

    // Espiar createElement para atrapar los canvas creados
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const mockCtx = {
          drawImage: jest.fn((img: any, _dx: number, _dy: number) => {
            drawImageEvents.push({
              src: img.src,
              isDecoded: img.decoded === true,
              timestamp: Date.now(),
            });
          }),
        };
        const canvas = {
          width: 0,
          height: 0,
          getContext: jest.fn((type: string) => (type === '2d' ? mockCtx : null)),
        };
        createdCanvases.push(canvas);
        return canvas as any;
      }
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('procesarCuadrosBoomerang espera img.decode() en cada imagen antes de drawImage', async () => {
    const tanda = [
      'data:image/jpeg;base64,foto1',
      'data:image/jpeg;base64,foto2',
      'data:image/jpeg;base64,foto3',
    ];

    const resultadoCanvases = await procesarCuadrosBoomerang(tanda, 720, 1280);

    expect(resultadoCanvases).toHaveLength(3);
    expect(decodeEvents).toHaveLength(3);
    expect(drawImageEvents).toHaveLength(3);

    // Para cada cuadro procesado:
    for (let i = 0; i < tanda.length; i++) {
      const decodeEvt = decodeEvents[i];
      const drawEvt = drawImageEvents[i];

      expect(decodeEvt.src).toBe(tanda[i]);
      expect(drawEvt.src).toBe(tanda[i]);

      // drawImage DEBE ocurrir después o en el mismo tick posterior a decode()
      expect(drawEvt.timestamp).toBeGreaterThanOrEqual(decodeEvt.timestamp);

      // La imagen DEBE estar completamente decodificada (isDecoded = true)
      expect(drawEvt.isDecoded).toBe(true);
    }
  });

  it('si no se espera img.decode() los datos del cuadro quedan incompletos/vacíos', async () => {
    const tanda = ['data:image/jpeg;base64,foto_sin_esperar'];
    const drawSinEsperar: Array<{ src: string; isDecoded: boolean }> = [];

    // Función defectuosa vieja (sin await img.decode())
    async function procesarSinEsperarDecode(fotos: string[]) {
      for (const fUrl of fotos) {
        const c = document.createElement('canvas');
        const cCtx = c.getContext('2d');
        const img = new (global as any).Image();
        img.src = fUrl;
        // Se llama decode() pero NO se espera con await:
        img.decode();
        cCtx?.drawImage(img, 0, 0);
        drawSinEsperar.push({ src: img.src, isDecoded: img.decoded === true });
      }
    }

    await procesarSinEsperarDecode(tanda);

    expect(drawSinEsperar).toHaveLength(1);
    // Demuestra que sin el await, la imagen aún no está decodificada al momento de dibujar
    expect(drawSinEsperar[0].isDecoded).toBe(false);
  });

  it('el código real de la fotocabina incluye await img.decode() antes de drawImage', () => {
    const ruta = path.join(process.cwd(), 'src/app/evento/fotocabina/[fiestaId]/page.tsx');
    const codigo = fs.readFileSync(ruta, 'utf8');

    // Comprobar que en la sección de boomerang al recorrer la tanda se hace await img.decode()
    const matchTanda = codigo.indexOf('for (const fUrl of tanda)');
    expect(matchTanda).toBeGreaterThan(-1);

    const bloqueTanda = codigo.slice(matchTanda, matchTanda + 500);

    // Verifica que use await img.decode()
    expect(bloqueTanda).toMatch(/await\s+img\.decode\(\)/);

    // Y que await img.decode() esté antes de drawImage
    const idxDecode = bloqueTanda.indexOf('img.decode()');
    const idxDraw = bloqueTanda.indexOf('drawImage(img');
    expect(idxDecode).toBeGreaterThan(-1);
    expect(idxDraw).toBeGreaterThan(-1);
    expect(idxDecode).toBeLessThan(idxDraw);
  });
});
