/**
 * Revisión de la entrega 336 (24/11/2026): la fórmula nueva de unidades multiplicaba
 * directo cuando no podía convertir (gramos contra litros o contra "unidad"), y el
 * costo de esos platos salía mil veces más caro en todos los presupuestos.
 * Lo que no se puede convertir se calcula como se calculó siempre.
 */
import { calcularCostoIngredienteEnReceta } from '@/lib/catering/unidades';

describe('el costo de un ingrediente no se multiplica por mil', () => {
  it('gramos contra un insumo en litros se divide por mil, como antes', () => {
    expect(calcularCostoIngredienteEnReceta(200, 100, 'Gramos', 'Litro')).toBeCloseTo(20);
  });
  it('gramos contra un insumo por unidad se divide por mil, como antes', () => {
    expect(calcularCostoIngredienteEnReceta(50, 300, 'Gramos', 'Unidad')).toBeCloseTo(15);
  });
  it('mililitros contra un insumo en kilos se divide por mil, como antes', () => {
    expect(calcularCostoIngredienteEnReceta(100, 400, 'ml', 'Kg')).toBeCloseTo(40);
  });
  it('sin unidad en la receta se multiplica directo, como antes', () => {
    expect(calcularCostoIngredienteEnReceta(2, 400, '', 'kg')).toBeCloseTo(800);
  });
  it('lo que sí se convierte sigue bien', () => {
    expect(calcularCostoIngredienteEnReceta(500, 400, 'gr', 'kg')).toBeCloseTo(200);
    expect(calcularCostoIngredienteEnReceta(2, 10, 'kg', 'g')).toBeCloseTo(20000);
  });
});
