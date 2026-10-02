/**
 * @fileOverview Prueba de selección de fotos para el video resumen (Orden 106 - Bloque 14).
 * Con 50 fotos de prueba (10 borrosas):
 * 1. La selección no incluye ninguna borrosa.
 * 2. Elige como máximo 30 fotos.
 * 3. Respeta el orden de la noche.
 */

import { seleccionarFotosParaVideoResumen } from '@/lib/video-resumen/elegir-fotos-video';

describe('Orden 106 Bloque 14 — Selección de fotos para el video resumen', () => {
  it('con 50 fotos de prueba (10 borrosas), descarta las borrosas, elige como máximo 30 y respeta el orden', () => {
    // Generamos 50 fotos: 10 borrosas y 40 nítidas con timestamps secuenciales
    const baseTime = new Date('2026-10-15T21:00:00Z').getTime();
    const fotosPrueba = Array.from({ length: 50 }, (_, i) => {
      const esBorrosa = i % 5 === 0 && i < 50; // 10 fotos borrosas (i=0, 5, 10, 15, 20, 25, 30, 35, 40, 45)
      return {
        id: `foto-${i}`,
        imageUrl: `https://storage.googleapis.com/test-ak/foto-${i}.jpg`,
        timestamp: new Date(baseTime + i * 5 * 60 * 1000).toISOString(), // cada 5 minutos
        nitidez: esBorrosa ? 20 : 85, // 20 = borrosa, 85 = nítida
      };
    });

    const resultado = seleccionarFotosParaVideoResumen(fotosPrueba, { maxFotos: 30 });

    // 1. Elige como máximo 30 fotos
    expect(resultado.length).toBeLessThanOrEqual(30);
    expect(resultado.length).toBe(30);

    // 2. Ninguna foto borrosa fue seleccionada
    const contieneBorrosa = resultado.some((f) => f.nitidez < 40);
    expect(contieneBorrosa).toBe(false);

    // 3. Respeta el orden de la noche (cronológico)
    for (let j = 1; j < resultado.length; j++) {
      const prev = new Date(resultado[j - 1].timestamp).getTime();
      const curr = new Date(resultado[j].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
