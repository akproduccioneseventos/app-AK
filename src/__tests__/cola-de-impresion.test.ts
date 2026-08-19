/**
 * La cola de impresión aparece sólo en las estaciones que imprimen.
 *
 * El dueño lo confirmó el 19 de agosto de 2026: se imprime en la fotocabina, la
 * plataforma 360 y el 360 con inteligencia artificial. La barra NO imprime.
 *
 * La pantalla existía terminada y no se llegaba desde ningún lado: había que
 * escribir la dirección a mano.
 */
import { getEntertainmentPrintPath, estacionImprime } from '@/lib/entertainment/station-config';

describe('Cola de impresión de las estaciones', () => {
  it('las tres que imprimen tienen su cola', () => {
    for (const estacion of ['fotocabina', 'plataforma360', 'espejoMagicoIA'] as const) {
      expect(estacionImprime(estacion)).toBe(true);
      expect(getEntertainmentPrintPath('f1', estacion)).toContain('/evento/impresion/f1');
    }
  });

  it('las que no imprimen no la ofrecen', () => {
    for (const estacion of ['bogue', 'espejoMagicoFoto', 'espejoMagicoFirma', 'totems', 'capsulaTiempo'] as const) {
      expect(estacionImprime(estacion)).toBe(false);
      expect(getEntertainmentPrintPath('f1', estacion)).toBeNull();
    }
  });

  it('lleva el permiso del operador cuando hay uno', () => {
    expect(getEntertainmentPrintPath('f1', 'fotocabina', 'tok123')).toContain('access=tok123');
  });
});
