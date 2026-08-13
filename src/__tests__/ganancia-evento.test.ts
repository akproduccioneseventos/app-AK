import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import type { GestionCostosData, PagoProveedor } from '@/types/fiesta';

/**
 * Estas cuentas deciden si una fiesta dejó plata o no. Un error acá no se ve en
 * pantalla: se ve el mes que viene, en el banco.
 */

function costos(extra: Partial<GestionCostosData> = {}): GestionCostosData {
  return {
    ingresosTotalesEstimados: 100000,
    costosItems: [
      { id: 'c1', nombre: 'Salón', category: 'lugar', montoEstimado: 20000 },
      { id: 'c2', nombre: 'Fotógrafo', category: 'proveedor', montoEstimado: 10000 },
    ],
    others: {},
    ...extra,
  };
}

function pago(costoAsociadoId: string, monto: number): PagoProveedor {
  return { id: `p_${costoAsociadoId}_${monto}`, costoAsociadoId, fecha: '2026-08-01', monto };
}

describe('cuánta plata dejó una fiesta', () => {
  it('sin pagos cargados, lo real es lo estimado y lo dice', () => {
    const r = calcularGananciaDeEvento(costos(), []);

    expect(r.costoEstimado).toBe(30000);
    expect(r.costoReal).toBe(30000);
    expect(r.gananciaReal).toBe(70000);
    expect(r.hayGastoCargado).toBe(false);
  });

  it('cuando se gastó MÁS de lo estimado, la ganancia real baja', () => {
    // El salón salió 35.000 en vez de 20.000.
    const r = calcularGananciaDeEvento(costos(), [pago('c1', 35000)]);

    expect(r.costoEstimado).toBe(30000);
    expect(r.costoReal).toBe(45000);
    expect(r.gananciaEstimada).toBe(70000);
    expect(r.gananciaReal).toBe(55000);
    expect(r.hayGastoCargado).toBe(true);
  });

  it('cuando se gastó menos, la ganancia real sube', () => {
    const r = calcularGananciaDeEvento(costos(), [pago('c1', 12000)]);

    expect(r.costoReal).toBe(22000);
    expect(r.gananciaReal).toBe(78000);
  });

  it('varios pagos al mismo renglón se suman', () => {
    const r = calcularGananciaDeEvento(costos(), [pago('c1', 10000), pago('c1', 15000)]);

    expect(r.costoReal).toBe(35000);
    expect(r.pagadoAProveedores).toBe(25000);
  });

  it('un pago que no corresponde a ningún renglón igual cuenta como plata gastada', () => {
    // Es plata que salió: esconderla mostraría una ganancia que no existe.
    const r = calcularGananciaDeEvento(costos(), [pago('renglon-borrado', 8000)]);

    expect(r.costoReal).toBe(38000);
  });

  it('NO cuenta dos veces la merma de bebidas', () => {
    // El total de bebidas ya trae el 5% adentro, y ademas figura como renglon.
    const conMerma = costos({
      costosItems: [
        { id: 'c1', nombre: 'Salón', category: 'lugar', montoEstimado: 20000 },
        { id: 'auto_merma_bebidas', nombre: 'Merma', category: 'bebidas', montoEstimado: 5000 },
      ],
      others: { totalBebidasCost: 105000 },
    });

    const r = calcularGananciaDeEvento(conMerma, []);

    expect(r.costoEstimado).toBe(125000);
  });

  it('un pago cargado a la merma duplicada igual se cuenta una sola vez', () => {
    const conMerma = costos({
      costosItems: [
        { id: 'c1', nombre: 'Salón', category: 'lugar', montoEstimado: 20000 },
        { id: 'auto_merma_bebidas', nombre: 'Merma', category: 'bebidas', montoEstimado: 5000 },
      ],
      others: { totalBebidasCost: 105000 },
    });

    const r = calcularGananciaDeEvento(conMerma, [pago('auto_merma_bebidas', 4000)]);

    expect(r.costoReal).toBe(129000);
  });

  it('suma la comida, las bebidas, la repostería y los sueldos', () => {
    const conBloques = costos({
      others: {
        totalCateringCost: 40000,
        totalBebidasCost: 15000,
        totalReposteriaCost: 5000,
        totalPersonalCost: 25000,
      },
    });

    const r = calcularGananciaDeEvento(conBloques, []);

    expect(r.costoEstimado).toBe(115000);
    expect(r.gananciaEstimada).toBe(-15000);
  });

  it('avisa que una fiesta da pérdida en vez de mostrar cero', () => {
    const r = calcularGananciaDeEvento(costos({ ingresosTotalesEstimados: 20000 }), []);

    expect(r.gananciaReal).toBe(-10000);
    expect(r.margenReal).toBeCloseTo(-50);
  });

  it('sin ingreso cargado no inventa un porcentaje', () => {
    const r = calcularGananciaDeEvento(costos({ ingresosTotalesEstimados: 0 }), []);

    expect(r.margenReal).toBe(0);
    expect(r.gananciaReal).toBe(-30000);
  });

  it('con datos vacíos o rotos devuelve ceros y no explota', () => {
    expect(calcularGananciaDeEvento(undefined, undefined).costoReal).toBe(0);
    expect(calcularGananciaDeEvento(null, null).gananciaReal).toBe(0);

    const roto = calcularGananciaDeEvento(
      costos({ ingresosTotalesEstimados: Number.NaN as unknown as number }),
      [{ id: 'x', costoAsociadoId: 'c1', fecha: '', monto: Number.NaN as unknown as number }],
    );
    expect(Number.isFinite(roto.costoReal)).toBe(true);
    expect(Number.isFinite(roto.gananciaReal)).toBe(true);
  });

  it('dice cuánto todavía no se rindió', () => {
    const r = calcularGananciaDeEvento(costos(), [pago('c1', 20000)]);

    // El fotógrafo (10.000) sigue sin pago cargado.
    expect(r.sinRendir).toBe(10000);
  });
});
