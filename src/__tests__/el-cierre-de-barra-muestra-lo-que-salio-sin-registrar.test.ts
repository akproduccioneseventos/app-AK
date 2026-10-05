/**
 * Cierre de barra (28/09/2026): se cuentan las botellas al cerrar y la app dice qué salió
 * sin pasar por un pedido. El ajuste del depósito se hace por diferencia, no pisando.
 */
import fs from 'fs';
import path from 'path';
import {
  ajustesAlConteo,
  compararConElConteo,
  consumoPorPedidos,
  insumosDeLaBarra,
  type FilaDelCierre,
} from '@/lib/barra/cierre-de-barra';
import type { BarDrinkOrder } from '@/types/barra-tecnologica';

const fila = (insumoId: string, enSistema: number): FilaDelCierre => ({
  insumoId, nombre: insumoId, unidad: 'botella', enSistema, consumidoPorPedidos: 0,
});

describe('el cierre de barra', () => {
  it('toma los insumos de las recetas sin repetir', () => {
    expect(insumosDeLaBarra([
      { recetaIngredientes: [{ insumoId: 'ron', cantidad: 1 }, { insumoId: 'coca', cantidad: 1 }] },
      { recetaIngredientes: [{ insumoId: 'ron', cantidad: 1 }] },
    ] as any)).toEqual(['ron', 'coca']);
  });

  it('suma lo que descontaron los pedidos, sin los cancelados ni los devueltos', () => {
    const pedidos = [
      { status: 'entregado', stockMovements: [{ insumoId: 'ron', cantidad: 0.1 }] },
      { status: 'cancelado', stockMovements: [{ insumoId: 'ron', cantidad: 5 }] },
      { status: 'nuevo', stockRestoredAt: 'x', stockMovements: [{ insumoId: 'ron', cantidad: 5 }] },
      { status: 'listo', stockMovements: [{ insumoId: 'ron', cantidad: 0.2 }] },
    ] as BarDrinkOrder[];
    expect(consumoPorPedidos(pedidos).get('ron')).toBeCloseTo(0.3);
  });

  it('dice cuánto falta y cuánto sobra contra lo contado', () => {
    const [ron, vodka, gin] = compararConElConteo(
      [fila('ron', 10), fila('vodka', 4), fila('gin', 3)],
      { ron: 8, vodka: 5, gin: undefined },
    );
    expect(ron.diferencia).toBe(2);
    expect(vodka.diferencia).toBe(-1);
    expect(gin.diferencia).toBeUndefined();
  });

  it('un conteo negativo no cuenta', () => {
    expect(compararConElConteo([fila('ron', 10)], { ron: -3 })[0].contado).toBeUndefined();
  });

  it('el ajuste del depósito es la diferencia, sólo de lo contado', () => {
    const filas = compararConElConteo([fila('ron', 10), fila('vodka', 4), fila('gin', 3)], { ron: 8, vodka: 4 });
    expect(ajustesAlConteo(filas)).toEqual([{ insumoId: 'ron', ajuste: -2 }]);
  });

  it('el servidor exige permiso de barra y mueve el depósito por diferencia', () => {
    const acciones = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/fiesta/barra-tecnologica.actions.ts'), 'utf8');
    const guardar = acciones.slice(acciones.indexOf('export async function guardarCierreDeBarra'));
    expect(guardar.slice(0, guardar.indexOf('\n}\n'))).toMatch(/await requireEventPermission\(fiestaId, PERMISO_DE_LA_BARRA\);/);
    expect(acciones).toMatch(/cantidadDisponible: Math\.max\(0, available \+ ajustes\[index\]\.ajuste\)/);
    const panel = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/barra-tecnologica/page.tsx'), 'utf8');
    expect(panel).toMatch(/<CierreDeBarra fiestaId=\{fiestaId\} \/>/);
  });
});
