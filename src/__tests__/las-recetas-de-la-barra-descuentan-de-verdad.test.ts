/**
 * Las recetas de la barra descuentan de verdad (orden 110, 2/10/2026).
 * La 1249 traía recetas con insumos que no existían (`ins-vodka`…) y en mililitros: el descuento
 * resta la cantidad tal cual del insumo con ese id, así que no se descontaba nada, y con el id
 * bueno se habrían descontado 50 botellas por trago.
 */
import fs from 'fs';
import path from 'path';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

const insumos: Array<{ id: string; unidad: string }> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/insumos.json'), 'utf8'),
);
const porId = new Map(insumos.map((i) => [i.id, i]));

describe('Las recetas de la barra descuentan de verdad', () => {
  it('son los 17 tragos de la carta', () => {
    expect(defaultCartaTragosData.items).toHaveLength(17);
  });

  it('cada ingrediente es un insumo que existe, en su misma unidad', () => {
    for (const trago of defaultCartaTragosData.items) {
      for (const ing of trago.recetaIngredientes || []) {
        const insumo = porId.get(ing.insumoId);
        expect({ trago: trago.nombre, id: ing.insumoId, existe: !!insumo }).toEqual({ trago: trago.nombre, id: ing.insumoId, existe: true });
        expect(ing.unidad).toBe(insumo!.unidad);
      }
    }
  });

  it('un trago descuenta una fracción de botella, no mililitros', () => {
    for (const trago of defaultCartaTragosData.items) {
      for (const ing of trago.recetaIngredientes || []) {
        if (ing.unidad === 'Botella' || ing.unidad === 'Litro' || ing.unidad === 'Kg') {
          expect(ing.cantidad).toBeGreaterThan(0);
          expect(ing.cantidad).toBeLessThan(1);
        }
      }
    }
  });

  it('el Atomic green lleva 45 ml de vodka, 30 de blue curaçao y 225 de jugo de naranja', () => {
    const atomic = defaultCartaTragosData.items.find((t) => t.nombre === 'Atomic green')!;
    const de = (id: string) => atomic.recetaIngredientes!.find((i) => i.insumoId === id)!.cantidad;
    expect(de('ing-vodka')).toBeCloseTo(45 / 750, 3);
    expect(de('ing-blue-curacao')).toBeCloseTo(30 / 750, 3);
    expect(de('ing-naranja')).toBeCloseTo(0.225, 3);
  });
});
