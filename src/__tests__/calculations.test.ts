/**
 * Tests for calculation functions in src/lib/calculations.ts
 */

import { getGuestCountForItem, recalcularCostoItem, calculateSuggestedQuantity } from '@/lib/calculations';

describe('getGuestCountForItem', () => {
  test('returns total for generic service', () => {
    const item = { nombreServicio: 'DJ' };
    expect(getGuestCountForItem(item, 100, 10, 20)).toBe(130);
  });

  test('returns only minors for infantil category', () => {
    const item = { nombreServicio: 'Animación', categoriaServicio: 'Infantil' };
    expect(getGuestCountForItem(item, 100, 10, 20)).toBe(30);
  });

  test('returns only adults for plato principal', () => {
    const item = { nombreServicio: 'Plato principal adultos', categoriaServicio: 'Platos' };
    expect(getGuestCountForItem(item, 100, 10, 20)).toBe(100);
  });

  test('handles zero guests', () => {
    const item = { nombreServicio: 'Servicio' };
    expect(getGuestCountForItem(item, 0, 0, 0)).toBe(0);
  });

  test('handles null/undefined item', () => {
    expect(getGuestCountForItem(null as any, 50, 5, 10)).toBe(65);
  });
});

describe('recalcularCostoItem', () => {
  test('returns 0 for null item', () => {
    expect(recalcularCostoItem(null as any, 100, 0, 0)).toBe(0);
  });

  test('returns 0 for regalo item', () => {
    const item = {
      nombreServicio: 'Regalo',
      precioUnitario: 1000,
      precioUnitarioPresupuesto: 1000,
      cantidad: 1,
      esRegalo: true,
    } as any;
    expect(recalcularCostoItem(item, 100, 0, 0)).toBe(0);
  });

  test('calculates default (qty * price) for items without calculationMethod', () => {
    const item = {
      nombreServicio: 'Servicio básico',
      precioUnitario: 500,
      precioUnitarioPresupuesto: 500,
      cantidad: 3,
    } as any;
    expect(recalcularCostoItem(item, 100, 0, 0)).toBe(1500);
  });

  test('calculates porPersona correctly', () => {
    const item = {
      nombreServicio: 'Servicio por persona',
      precioUnitario: 100,
      precioUnitarioPresupuesto: 100,
      cantidad: 1,
      calculationMethod: 'porPersona',
    } as any;
    expect(recalcularCostoItem(item, 50, 0, 10)).toBe(6000);
  });

  test('calculates fijo correctly', () => {
    const item = {
      nombreServicio: 'Servicio fijo',
      precioUnitario: 2000,
      precioUnitarioPresupuesto: 2000,
      cantidad: 2,
      calculationMethod: 'fijo',
    } as any;
    expect(recalcularCostoItem(item, 100, 0, 0)).toBe(4000);
  });

  test('calculates ratio correctly', () => {
    const item = {
      nombreServicio: 'Torta',
      precioUnitario: 500,
      precioUnitarioPresupuesto: 500,
      cantidad: 1,
      calculationMethod: 'ratio',
      invitadosPorUnidad: 10,
    } as any;
    // 100 guests / 10 per unit = 10 units * 500 = 5000
    expect(recalcularCostoItem(item, 100, 0, 0)).toBe(5000);
  });
});

describe('calculateSuggestedQuantity', () => {
  test('returns guest count for porPersona', () => {
    const item = { nombreServicio: 'Plato', calculationMethod: 'porPersona' as const };
    expect(calculateSuggestedQuantity(item as any, 80, 20)).toBe(100);
  });

  test('returns fixed quantity for fijo', () => {
    const item = { nombreServicio: 'DJ', calculationMethod: 'fijo' as const, cantidad: 1 };
    expect(calculateSuggestedQuantity(item as any, 100, 0)).toBe(1);
  });

  test('returns 1 for tramos', () => {
    const item = { nombreServicio: 'Salon', calculationMethod: 'tramos' as const };
    expect(calculateSuggestedQuantity(item as any, 100, 0)).toBe(1);
  });
});
