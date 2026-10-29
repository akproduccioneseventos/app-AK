/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });

let mockUso: { fecha?: string; cantidad?: number } = {};
let mockCola: Promise<void> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn((_archivo: string, vacio: unknown, cambiar: (actual: any) => any) => {
    const operacion = mockCola.then(async () => {
      const nuevo = await cambiar(mockUso ?? vacio);
      if (nuevo !== null) mockUso = nuevo;
      return nuevo;
    });
    mockCola = operacion.then(() => undefined);
    return operacion;
  }),
}));
jest.mock('@/lib/utils', () => ({ hoyEnUruguay: () => '2026-10-29' }));

import { reservarCupoDiarioVozGemini } from './cuota-voz-gemini';

describe('cuota diaria compartida de voz Gemini', () => {
  beforeEach(() => { mockUso = {}; mockCola = Promise.resolve(); });

  it('reserva de forma atómica los últimos cupos y bloquea el número 101', async () => {
    mockUso = { fecha: '2026-10-29', cantidad: 95 };
    const resultados = await Promise.all(Array.from({ length: 10 }, () => reservarCupoDiarioVozGemini()));
    expect(resultados.filter(Boolean)).toHaveLength(5);
    expect(mockUso).toEqual({ fecha: '2026-10-29', cantidad: 100 });
  });

  it('reinicia el conteo cuando cambia el día de Uruguay', async () => {
    mockUso = { fecha: '2026-10-28', cantidad: 100 };
    await expect(reservarCupoDiarioVozGemini()).resolves.toBe(true);
    expect(mockUso).toEqual({ fecha: '2026-10-29', cantidad: 1 });
  });
});
