/**
 * Pruebas unitarias para el Bloque 8:
 * "Que lo impreso salga como sale de verdad"
 *
 * Verifica:
 * 1. Tamaño estándar 10x15 (1200x1800).
 * 2. Fotocabina (3 fotos): 1 grande arriba + 2 chicas abajo lado a lado.
 * 3. Espejo Mágico / 360 IA (1 foto): 1 sola foto en hoja 10x15 personalizada.
 * 4. Nombre del homenajeado en letra manuscrita grande, motivo debajo y logo de AK.
 * 5. Sin nombre cargado, no inventa ningún texto de relleno ("La Agasajada", etc).
 */

import {
  componerTiraDeFotos,
  FOTOS_POR_TANDA,
  SEGUNDOS_PRIMERA_FOTO,
  GUIA_POR_FOTO,
} from '@/lib/entretenimiento/tira-fotocabina';

describe('Bloque 8 — Impreso real de 10x15 y personalización de estaciones', () => {
  let createdCanvas: any = null;
  let mockCtx: any = null;

  beforeEach(() => {
    mockCtx = {
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      strokeRect: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      beginPath: jest.fn(),
      rect: jest.fn(),
      roundRect: jest.fn(),
      clip: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      createLinearGradient: jest.fn().mockReturnValue({
        addColorStop: jest.fn(),
      }),
      measureText: jest.fn().mockReturnValue({ width: 100 }),
    };

    createdCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(mockCtx),
      toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mocked-print-image'),
    };

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return createdCanvas as any;
      }
      return document.createElement(tagName);
    });

    // Mock Image
    (global as any).Image = class {
      width = 800;
      height = 600;
      crossOrigin = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 1);
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('constantes de fotocabina definidas correctamente', () => {
    expect(FOTOS_POR_TANDA).toBe(3);
    expect(SEGUNDOS_PRIMERA_FOTO).toBe(10);
    expect(GUIA_POR_FOTO.length).toBe(3);
  });

  it('el canvas mide 1200x1800 (proporción 10x15)', async () => {
    await componerTiraDeFotos({
      fotos: ['data:image/jpeg;base64,f1', 'data:image/jpeg;base64,f2', 'data:image/jpeg;base64,f3'],
      nombreDelEvento: 'Mis 15 Areli',
      nombreHomenajeado: 'Areli',
      motivoDelEvento: 'Mis 15 Años',
      fechaDelEvento: '2026-08-19',
      colorDeAcento: '#a855f7',
    });

    expect(createdCanvas.width).toBe(1200);
    expect(createdCanvas.height).toBe(1800);
  });

  it('arma el reparto de 3 fotos: 1 grande arriba y 2 chicas abajo lado a lado', async () => {
    await componerTiraDeFotos({
      fotos: ['data:image/jpeg;base64,f1', 'data:image/jpeg;base64,f2', 'data:image/jpeg;base64,f3'],
      nombreHomenajeado: 'Areli',
      motivoDelEvento: 'Mis 15 Años',
      colorDeAcento: '#a855f7',
    });

    // Debe haber dibujado 3 imágenes de fotos
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(3);

    // Debe escribir el nombre del homenajeado y motivo
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      'Areli',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      'Mis 15 Años',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    // Debe incluir el logo institucional "AK" y "PRODUCCIONES"
    expect(mockCtx.fillText).toHaveBeenCalledWith('AK', expect.any(Number), expect.any(Number));
    expect(mockCtx.fillText).toHaveBeenCalledWith('PRODUCCIONES', expect.any(Number), expect.any(Number));
  });

  it('soporta 1 sola foto para espejo mágico y 360 con la misma personalización', async () => {
    await componerTiraDeFotos({
      fotos: ['data:image/jpeg;base64,f1'],
      nombreHomenajeado: 'Areli',
      motivoDelEvento: 'Mis 15 Años',
      fechaDelEvento: '2026-08-19',
      colorDeAcento: '#a855f7',
    });

    // 1 sola imagen dibujada
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);

    // Nombre y motivo personalizados
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      'Areli',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      '19/08/2026',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('no pone texto inventado de relleno cuando falta el nombre', async () => {
    await componerTiraDeFotos({
      fotos: ['data:image/jpeg;base64,f1'],
      colorDeAcento: '#a855f7',
    });

    const llamadas = mockCtx.fillText.mock.calls.map((c: any[]) => c[0]);
    expect(llamadas).not.toContain('La Agasajada');
    expect(llamadas).not.toContain('Homenajeado');
    expect(llamadas).not.toContain('Evento AK');
  });
});
