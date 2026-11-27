/**
 * Revisión de la entrega 336 (24/11/2026): la fórmula nueva de unidades multiplicaba
 * directo cuando no podía convertir (gramos contra litros o contra "unidad"), y el
 * costo de esos platos salía mil veces más caro en todos los presupuestos.
 * Lo que no se puede convertir se calcula como se calculó siempre.
 */
import { calcularCostoIngredienteEnReceta } from '@/lib/catering/unidades';

describe('el costo de un ingrediente no se multiplica por mil', () => {
  it('unidades incompatibles sin conversión (gramos vs litros/unidad, ml vs kilos) devuelven $0 para no multiplicar el costo por error (Orden 368 B5.3)', () => {
    expect(calcularCostoIngredienteEnReceta(200, 100, 'Gramos', 'Litro')).toBe(0);
    expect(calcularCostoIngredienteEnReceta(50, 300, 'Gramos', 'Unidad')).toBe(0);
    expect(calcularCostoIngredienteEnReceta(100, 400, 'ml', 'Kg')).toBe(0);
  });
  it('sin unidad en la receta se multiplica directo, como antes', () => {
    expect(calcularCostoIngredienteEnReceta(2, 400, '', 'kg')).toBeCloseTo(800);
  });
  it('lo que sí se convierte (incluyendo Docena) sigue bien', () => {
    expect(calcularCostoIngredienteEnReceta(500, 400, 'gr', 'kg')).toBeCloseTo(200);
    expect(calcularCostoIngredienteEnReceta(2, 10, 'kg', 'g')).toBeCloseTo(20000);
    expect(calcularCostoIngredienteEnReceta(2, 180, 'Unidad', 'Docena') * 50).toBeCloseTo(1500);
  });
});
