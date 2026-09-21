/**
 * MATAFUEGO — Una lectura colgada de la base NO puede tumbar la pantalla entera.
 *
 * El 10 de setiembre de 2026 se reporto que la app no abria en produccion: el visitante no
 * veia una pantalla vacia, veia el error del servidor. Delante del servidor hay un portero
 * que corta cualquier pedido que pase de unos diez segundos; si una lectura de la base se
 * quedaba colgada, el pedido entero llegaba a ese corte.
 *
 * Lo que queda: a los ocho segundos la lectura se da por fallada **antes** de ese corte, y
 * entra el camino de respaldo que ya existia. La pantalla abre.
 *
 * Y lo que NO cambia: la falla se sigue contando como falla, para que el respaldo no guarde
 * cero fiestas como si la empresa no tuviera ninguna.
 *
 * Se probo rompiendolo a proposito: sacando el tope de `readDataConDetalle`, esta prueba se
 * queda colgada y da rojo por tiempo agotado.
 */

jest.mock('@/lib/firebase-sync', () => ({
  readFromFirestore: jest.fn(() => new Promise(() => {})),
  syncToFirestore: jest.fn(),
}));
jest.mock('@/lib/generic-json-store', () => ({
  readGenericJsonFile: jest.fn(() => new Promise(() => {})),
  syncGenericJsonFile: jest.fn(),
  leerGenericJsonParaGuardarEncima: jest.fn(),
}));
jest.mock('@/lib/backup/backup-registry', () => ({ isSafeTopLevelJsonFile: () => false }));
jest.mock('@/lib/logger', () => ({
  error: jest.fn(),
  isBuildTime: () => false,
  isDefaultCredentialError: () => false,
  compactError: (e: unknown) => e,
}));

import { readDataConDetalle } from '@/lib/data-service';

describe('Una lectura colgada no tumba la pantalla', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('contesta con el valor por defecto en vez de quedarse colgada para siempre', async () => {
    const pedido = readDataConDetalle('fiestas.json', [] as unknown[]);
    // El portero del servidor corta a los diez segundos: el tope tiene que saltar antes.
    await jest.advanceTimersByTimeAsync(9000);
    const { valor, huboFalla } = await pedido;
    expect(valor).toEqual([]);
    expect(huboFalla).toBe(true);
  });

  it('el plazo es UNO para toda la lectura, no uno por deposito', async () => {
    // Con un tope por intento serian ocho segundos del primer deposito mas ocho del
    // segundo: dieciseis, o sea MAS que los diez del portero, y no serviria de nada.
    // Con los dos depositos colgados, a los nueve segundos ya tiene que haber contestado.
    const pedido = readDataConDetalle('fiestas.json', [] as unknown[]);
    let contesto = false;
    void pedido.then(() => { contesto = true; });
    await jest.advanceTimersByTimeAsync(7000);
    expect(contesto).toBe(false);
    await jest.advanceTimersByTimeAsync(2000);
    await pedido;
    expect(contesto).toBe(true);
  });
});
