import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockGetCupones = jest.fn();
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/app/actions/cupones', () => ({
  getCupones: (...args: any[]) => mockGetCupones(...args), saveCupon: jest.fn(),
  toggleCuponActivo: jest.fn(), deleteCupon: jest.fn(), getCuponStats: jest.fn(),
}));

import CuponesPage from '@/app/(app)/settings/cupones/page';

test.each([
  ['2026-10-08T02:59:59Z', 'Próximo'],
  ['2026-10-09T02:59:59.999Z', 'Activo'],
  ['2026-10-09T03:00:00Z', 'Expirado'],
])('los ajustes conservan el dia y muestran %s como %s', async (clock, status) => {
  jest.useFakeTimers({ doNotFake: ['setTimeout'] });
  jest.setSystemTime(new Date(clock));
  mockGetCupones.mockResolvedValue([{
    id: 'cupon-calendario', codigo: 'DIA8', nombre: 'Cupon de prueba', activo: true,
    fechaInicio: '2026-10-08', fechaFin: '2026-10-08', tipo: 'porcentaje', valor: 10,
    usosMaximos: 0, usosActuales: 0,
  }]);
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  try {
    await act(async () => { root.render(<CuponesPage />); await Promise.resolve(); });
    expect(host.textContent).toContain('DIA8');
    expect(host.textContent).toMatch(/08 oct\.? 2026/);
    expect(host.textContent).not.toMatch(/07 oct\.? 2026/);
    expect(Array.from(host.querySelectorAll('[class]')).some(e => e.textContent === status)).toBe(true);
  } finally { act(() => root.unmount()); host.remove(); jest.useRealTimers(); }
});

test('Nuevo calcula hoy al abrir, en Uruguay y no al cargar el archivo', async () => {
  jest.useFakeTimers({ doNotFake: ['setTimeout'] });
  jest.setSystemTime(new Date('2026-10-09T02:59:59Z'));
  mockGetCupones.mockResolvedValue([]);
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  try {
    await act(async () => { root.render(<CuponesPage />); await Promise.resolve(); });
    const abrir = () => Array.from(host.querySelectorAll('button')).find(b => /Nuevo Cupón/i.test(b.textContent || ''))!;
    await act(async () => { abrir().click(); await Promise.resolve(); });
    expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe('2026-10-08');
    const cancelar = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Cancelar')!;
    await act(async () => { cancelar.click(); await Promise.resolve(); });
    jest.setSystemTime(new Date('2026-10-10T02:59:59Z'));
    await act(async () => { abrir().click(); await Promise.resolve(); });
    expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe('2026-10-09');
  } finally { act(() => root.unmount()); host.remove(); jest.useRealTimers(); }
});
