/**
 * La lista publica de salones la puede pedir cualquiera desde el navegador. Devolvia lo que AK le
 * paga al salon (montos, comprobantes y notas) porque solo se sacaba el contacto del gerente.
 */
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [
    {
      id: 's1',
      nombre: 'Club Uruguay',
      direccion: 'Salto',
      googleMapsUrl: '',
      capacidad: 200,
      gerente: { nombre: 'Gerente', telefono: '099' },
      pagos: [{ id: 'p1', fecha: '2026-09-01', monto: 50000, metodoPago: 'Transferencia', notas: 'seña' }],
    },
  ]),
  writeData: jest.fn(),
  createDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn() }));

import { getSalonesPublicos } from '@/app/actions/salones';

describe('los pagos al salon no son publicos', () => {
  it('la lista publica trae el salon sin pagos ni gerente', async () => {
    const [salon] = await getSalonesPublicos();
    expect(salon.nombre).toBe('Club Uruguay');
    expect(salon.capacidad).toBe(200);
    expect(salon).not.toHaveProperty('pagos');
    expect(salon).not.toHaveProperty('gerente');
    expect(JSON.stringify(salon)).not.toContain('50000');
  });
});
