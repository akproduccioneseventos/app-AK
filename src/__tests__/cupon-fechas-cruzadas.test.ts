/**
 * Un cupon con la fecha de fin antes que la de inicio se guardaba igual y no
 * servia ni un solo dia. Nadie se enteraba hasta que un cliente lo intentaba
 * usar en la caja. Las promos ya lo controlaban; los cupones no.
 */
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
}));

import { saveCupon } from '@/app/actions/cupones';

const cuponBase = {
  codigo: 'VERANO',
  nombre: 'Descuento de verano',
  tipo: 'porcentaje' as const,
  valor: 10,
  usosMaximos: 0,
  activo: true,
};

describe('Fechas de un cupón', () => {
  it('no deja guardar uno que termina antes de empezar', async () => {
    const res = await saveCupon({
      ...cuponBase,
      fechaInicio: '2026-12-31',
      fechaFin: '2026-01-01',
    } as any);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/anterior a la de inicio/i);
  });

  it('deja guardar uno con las fechas en orden', async () => {
    const res = await saveCupon({
      ...cuponBase,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
    } as any);

    expect(res.success).toBe(true);
  });

  it('deja guardar uno que empieza y termina el mismo día', async () => {
    const res = await saveCupon({
      ...cuponBase,
      fechaInicio: '2026-06-15',
      fechaFin: '2026-06-15',
    } as any);

    expect(res.success).toBe(true);
  });
});
