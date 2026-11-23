/**
 * Auditoría 21/11/2026: Auditoría de plata y contabilidad
 */
import { describe, it, expect } from '@jest/globals';
import { calcularGananciaDeEvento, esPrecioDeVentaCopiado } from '@/lib/costos/ganancia-evento';
import { esFiestaDemo } from '@/lib/events/event-ordering';
import { avisosDeUnidadesDelMenu } from '@/lib/catering/unidades';

describe('Auditoría 21-11 Plata', () => {
  it('verifica esPrecioDeVentaCopiado', () => {
    expect(esPrecioDeVentaCopiado('sync_budget_serv_1')).toBe(true);
    expect(esPrecioDeVentaCopiado('item_manual_1')).toBe(false);
  });

  it('verifica calcularGananciaDeEvento con item copiado vs con costo de catálogo', () => {
    const itemSinCosto = { id: 'sync_budget_serv_1', nombre: 'Foto', montoEstimado: 15000 };
    const gananciaSinCosto = calcularGananciaDeEvento(
      { costosItems: [itemSinCosto], ingresosTotalesEstimados: 20000 } as any,
      []
    );
    // costoEstimado debe ser 0 porque es precio de venta copiado y no tiene costoDeCatalogo: true
    expect(gananciaSinCosto.costoEstimado).toBe(0);

    const itemConCosto = { id: 'sync_budget_serv_1', nombre: 'Foto', montoEstimado: 15000, costoDeCatalogo: true };
    const gananciaConCosto = calcularGananciaDeEvento(
      { costosItems: [itemConCosto], ingresosTotalesEstimados: 20000 } as any,
      []
    );
    expect(gananciaConCosto.costoEstimado).toBe(15000);
  });

  it('verifica esFiestaDemo para fiestas de prueba o reales', () => {
    expect(esFiestaDemo({ id: 'demo_123' })).toBe(true);
    expect(esFiestaDemo({ estado: 'Demo AK' })).toBe(true);
    expect(esFiestaDemo({ id: 'fiesta_real_01', estado: 'Confirmado' })).toBe(false);
  });

  it('verifica avisosDeUnidadesDelMenu para conversiones de unidades', () => {
    const ingredientes = [{ id: '1', name: 'Insumo', unit: 'g', origenId: 'cat1' }];

    const catalogoUnidad = [{ id: 'cat1', nombre: 'Insumo', unidad: 'Unidad' }];
    const avisosUnidad = avisosDeUnidadesDelMenu(ingredientes as any, catalogoUnidad as any);
    expect(avisosUnidad.length).toBe(1);
    expect(avisosUnidad[0]).toBeTruthy();

    const catalogoKg = [{ id: 'cat1', nombre: 'Insumo', unidad: 'kg' }];
    const avisosKg = avisosDeUnidadesDelMenu(ingredientes as any, catalogoKg as any);
    expect(avisosKg).toEqual([]);
  });
});
