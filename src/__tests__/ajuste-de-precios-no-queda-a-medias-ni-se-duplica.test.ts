/** @jest-environment node */
/**
 * Ajuste de precios tipo "ambos" y reversion (12/10/2026).
 *
 * Antes: "ambos" aplicaba los precios y despues los costos; si los costos fallaban quedaban los
 * precios subidos y, al reintentar, se subian OTRA vez. Revertir "ambos" tenia el mismo hueco.
 * Ahora el registro se anota antes de tocar nada, cada parte hecha se marca y el reintento termina
 * solo lo que falta. La base de mentira devuelve COPIAS.
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let historial: any[] = [];
const subirPrecios = jest.fn(async (_p: number) => ({ success: true } as { success: boolean; error?: string }));
const subirCostos = jest.fn(async (_p: number) => ({ success: true } as { success: boolean; error?: string }));

jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: any) => (historial.length ? copia(historial) : d)),
  writeData: jest.fn(async (_f: string, v: any) => { historial = copia(v); }),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(async () => [{ id: 's1', nombre: 'DJ', precioVenta: 1000 }]),
  adjustAllServicePrices: (p: number) => subirPrecios(p),
  adjustAllServiceCosts: (p: number) => subirCostos(p),
}));

import { applyPriceAdjustment, revertPriceAdjustment } from '@/app/actions/price-adjustments';

beforeEach(() => {
  historial = [];
  subirPrecios.mockReset().mockResolvedValue({ success: true });
  subirCostos.mockReset().mockResolvedValue({ success: true });
});

describe('aplicar "ambos"', () => {
  it('el registro se anota ANTES de tocar el primer precio', async () => {
    subirPrecios.mockImplementationOnce(async () => {
      expect(historial).toHaveLength(1);
      expect(historial[0].estado).toBe('aplicando');
      return { success: true };
    });
    const r = await applyPriceAdjustment(10, 'ambos');
    expect(r.success).toBe(true);
    expect(historial[0].estado).toBe('listo');
    expect(historial[0].partesHechas).toEqual(['precios', 'costos']);
  });

  it('si fallan los costos, el reintento NO vuelve a subir los precios', async () => {
    subirCostos.mockResolvedValueOnce({ success: false, error: 'la base no contesta' });
    const primero = await applyPriceAdjustment(10, 'ambos');
    expect(primero.success).toBe(false);
    expect(subirPrecios).toHaveBeenCalledTimes(1);

    const reintento = await applyPriceAdjustment(10, 'ambos');
    expect(reintento.success).toBe(true);
    expect(subirPrecios).toHaveBeenCalledTimes(1); // no se sube dos veces
    expect(subirCostos).toHaveBeenCalledTimes(2);
    expect(historial).toHaveLength(1); // y no se duplica el registro
    expect(historial[0].estado).toBe('listo');
  });

  it('con otro porcentaje no deja sumar encima de un ajuste a medias', async () => {
    subirCostos.mockResolvedValueOnce({ success: false, error: 'corte' });
    await applyPriceAdjustment(10, 'ambos');
    const otro = await applyPriceAdjustment(5, 'ambos');
    expect(otro.success).toBe(false);
    expect(otro.error).toMatch(/10%/);
    expect(subirPrecios).toHaveBeenCalledTimes(1);
  });
});

describe('revertir "ambos"', () => {
  it('si fallan los costos al revertir, el reintento no vuelve a bajar los precios', async () => {
    const hecho = await applyPriceAdjustment(10, 'ambos');
    const id = hecho.record!.id;
    subirPrecios.mockClear(); subirCostos.mockClear();
    subirCostos.mockResolvedValueOnce({ success: false, error: 'corte' });

    const primero = await revertPriceAdjustment(id);
    expect(primero.success).toBe(false);
    expect(historial[0].revertido).toBeFalsy();
    expect(subirPrecios).toHaveBeenCalledTimes(1);

    const reintento = await revertPriceAdjustment(id);
    expect(reintento.success).toBe(true);
    expect(subirPrecios).toHaveBeenCalledTimes(1); // los precios se bajaron una sola vez
    expect(subirCostos).toHaveBeenCalledTimes(2);
    expect(historial[0].revertido).toBe(true);
    const tercero = await revertPriceAdjustment(id);
    expect(tercero.success).toBe(false);
  });
});
