/** @jest-environment node */
/**
 * Prueba funcional del auditor (12/11/2026): servicio a 100, ajuste +10% → 110, revertir → -890. La cuenta del
 * porcentaje inverso multiplicaba de más por 100. Y la acción vieja aceptaba -200% y dejaba precios negativos.
 */
import { porcentajeInverso, porcentajeDeAjusteValido } from '@/lib/precios/porcentaje-inverso';

let historial: any[] = [];
const pedidos: number[] = [];
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: any) => (historial.length ? copia(historial) : d)),
  writeData: jest.fn(async (_f: string, v: any) => { historial = copia(v); }),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(async () => [{ id: 's1', nombre: 'DJ', precioVenta: 100 }]),
  adjustAllServicePrices: async (p: number) => { pedidos.push(p); return { success: true }; },
  adjustAllServiceCosts: async (p: number) => { pedidos.push(p); return { success: true }; },
}));

import { applyPriceAdjustment, revertPriceAdjustment } from '@/app/actions/price-adjustments';

const aplicar = (precio: number, p: number) => Math.round(precio * (1 + p / 100));

describe('Revertir un ajuste vuelve al precio de antes', () => {
  it('el inverso de +10% lleva 110 a 100, y el de -20% lleva 80 a 100', () => {
    expect(aplicar(aplicar(100, 10), porcentajeInverso(10))).toBe(100);
    expect(aplicar(aplicar(100, -20), porcentajeInverso(-20))).toBe(100);
    expect(aplicar(aplicar(40, 10), porcentajeInverso(10))).toBe(40);
  });

  it('revertPriceAdjustment pide al catálogo el inverso correcto, no -909%', async () => {
    historial = []; pedidos.length = 0;
    expect((await applyPriceAdjustment(10, 'precios')).success).toBe(true);
    expect((await revertPriceAdjustment(historial[0].id)).success).toBe(true);
    expect(pedidos[0]).toBe(10);
    expect(aplicar(aplicar(100, pedidos[0]), pedidos[1])).toBe(100);
  });

  it('no se acepta bajar un 100% o más', () => {
    expect(porcentajeDeAjusteValido(-200)).toMatch(/100%/);
    expect(porcentajeDeAjusteValido(-100)).toMatch(/100%/);
    expect(porcentajeDeAjusteValido(-50)).toBeNull();
    expect(porcentajeDeAjusteValido(0)).not.toBeNull();
  });
});
