import {
  getGuestCountForItem,
  recalcularCostoItem,
  calculateSuggestedQuantity,
} from '@/lib/calculations';
import type { ItemPresupuestado } from '@/types/presupuesto';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ItemPresupuestado> & { nombreServicio: string }): ItemPresupuestado {
  return {
    idServicioCatalogo: 'test',
    descripcionServicio: '',
    cantidad: 1,
    precioUnitario: 100,
    precioUnitarioPresupuesto: 100,
    costoTotalItem: 0,
    calculationMethod: 'fijo',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getGuestCountForItem
// ─────────────────────────────────────────────────────────────────────────────

describe('getGuestCountForItem', () => {
  const adultos = 80;
  const adolescentes = 10;
  const ninos = 20;

  it('returns total guests for a general service (e.g. Torta)', () => {
    const item = { nombreServicio: 'Torta', categoriaServicio: 'Pastelería' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adultos + adolescentes + ninos);
  });

  it('returns only children+adolescents for infantil category', () => {
    const item = { nombreServicio: 'Juegos', categoriaServicio: 'Infantil' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adolescentes + ninos);
  });

  it('returns only children+adolescents for adolescente subcategory', () => {
    const item = { nombreServicio: 'DJ Teen', categoriaServicio: 'Música', subcategoria: 'Adolescente' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adolescentes + ninos);
  });

  it('returns only children+adolescents for service name containing niño', () => {
    const item = { nombreServicio: 'Menú niño' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adolescentes + ninos);
  });

  it('returns only adults for plato principal category', () => {
    const item = { nombreServicio: 'Carne asada', categoriaServicio: 'Plato Principal' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adultos);
  });

  it('returns only adults for service with "principal" in name (not niño)', () => {
    const item = { nombreServicio: 'Principal de mar', categoriaServicio: 'Comidas' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adultos);
  });

  it('returns total guests for generic service (Salón, Bebidas, etc.)', () => {
    const item = { nombreServicio: 'Salón' };
    expect(getGuestCountForItem(item, adultos, adolescentes, ninos)).toBe(adultos + adolescentes + ninos);
  });

  it('handles zero guests gracefully', () => {
    const item = { nombreServicio: 'Decoración' };
    expect(getGuestCountForItem(item, 0, 0, 0)).toBe(0);
  });

  it('handles undefined adolescentes and ninos', () => {
    const item = { nombreServicio: 'Bebidas' };
    expect(getGuestCountForItem(item, 50, 0, 0)).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// recalcularCostoItem
// ─────────────────────────────────────────────────────────────────────────────

describe('recalcularCostoItem', () => {
  const adultos = 100;
  const adolescentes = 0;
  const ninos = 0;

  it('returns 0 for null/undefined item', () => {
    expect(recalcularCostoItem(null as any, adultos, adolescentes, ninos)).toBe(0);
  });

  it('returns 0 for esRegalo = true', () => {
    const item = makeItem({ nombreServicio: 'Regalo', esRegalo: true, calculationMethod: 'fijo', precioUnitario: 500, precioUnitarioPresupuesto: 500 });
    expect(recalcularCostoItem(item, adultos, adolescentes, ninos)).toBe(0);
  });

  describe('calculationMethod = fijo', () => {
    it('multiplies price by quantity', () => {
      const item = makeItem({ nombreServicio: 'Decoración', calculationMethod: 'fijo', cantidad: 3, precioUnitario: 200, precioUnitarioPresupuesto: 200 });
      expect(recalcularCostoItem(item, adultos, adolescentes, ninos)).toBe(600);
    });

    it('uses quantity = 1 when cantidad is 0', () => {
      const item = makeItem({ nombreServicio: 'Decoración', calculationMethod: 'fijo', cantidad: 0, precioUnitario: 200, precioUnitarioPresupuesto: 200 });
      expect(recalcularCostoItem(item, adultos, adolescentes, ninos)).toBe(200);
    });
  });

  describe('calculationMethod = porPersona', () => {
    it('multiplies price by guest count', () => {
      const item = makeItem({ nombreServicio: 'Catering', calculationMethod: 'porPersona', precioUnitario: 50, precioUnitarioPresupuesto: 50 });
      expect(recalcularCostoItem(item, 100, 0, 0)).toBe(5000);
    });

    it('returns 0 when no guests', () => {
      const item = makeItem({ nombreServicio: 'Catering', calculationMethod: 'porPersona', precioUnitario: 50, precioUnitarioPresupuesto: 50 });
      expect(recalcularCostoItem(item, 0, 0, 0)).toBe(0);
    });
  });

  describe('calculationMethod = ratio', () => {
    it('calculates units needed based on invitadosPorUnidad', () => {
      const item = makeItem({ nombreServicio: 'Mesas', calculationMethod: 'ratio', invitadosPorUnidad: 10, precioUnitario: 300, precioUnitarioPresupuesto: 300 });
      // 100 guests / 10 per unit = 10 units * $300 = $3000
      expect(recalcularCostoItem(item, 100, 0, 0)).toBe(3000);
    });

    it('rounds up units when guests do not divide evenly', () => {
      const item = makeItem({ nombreServicio: 'Mesas', calculationMethod: 'ratio', invitadosPorUnidad: 8, precioUnitario: 300, precioUnitarioPresupuesto: 300 });
      // 100 guests / 8 per unit = 12.5 → 13 units * $300 = $3900
      expect(recalcularCostoItem(item, 100, 0, 0)).toBe(3900);
    });

    it('falls back to price when ratio is 0', () => {
      const item = makeItem({ nombreServicio: 'Mesas', calculationMethod: 'ratio', invitadosPorUnidad: 0, precioUnitario: 300, precioUnitarioPresupuesto: 300 });
      expect(recalcularCostoItem(item, 100, 0, 0)).toBe(300);
    });

    it('returns 0 when no guests', () => {
      const item = makeItem({ nombreServicio: 'Mesas', calculationMethod: 'ratio', invitadosPorUnidad: 10, precioUnitario: 300, precioUnitarioPresupuesto: 300 });
      expect(recalcularCostoItem(item, 0, 0, 0)).toBe(0);
    });
  });

  describe('calculationMethod = tramos', () => {
    const tramos = [
      { id: '1', desde: 0, hasta: 50, precio: 1000 },
      { id: '2', desde: 51, hasta: 100, precio: 1800 },
      { id: '3', desde: 101, hasta: 200, precio: 3000 },
    ];

    it('selects the correct tramo based on total guests', () => {
      const item = makeItem({ nombreServicio: 'Salón', calculationMethod: 'tramos', tramosDePrecio: tramos });
      expect(recalcularCostoItem(item, 80, 0, 0)).toBe(1800);
    });

    it('returns 0 when no tramo matches', () => {
      const item = makeItem({ nombreServicio: 'Salón', calculationMethod: 'tramos', tramosDePrecio: tramos });
      expect(recalcularCostoItem(item, 250, 0, 0)).toBe(0);
    });

    it('returns first tramo for small guest count', () => {
      const item = makeItem({ nombreServicio: 'Salón', calculationMethod: 'tramos', tramosDePrecio: tramos });
      expect(recalcularCostoItem(item, 30, 0, 0)).toBe(1000);
    });
  });

  it('uses precioUnitarioPresupuesto when available', () => {
    const item = makeItem({ nombreServicio: 'Servicio', calculationMethod: 'fijo', cantidad: 1, precioUnitario: 100, precioUnitarioPresupuesto: 250 });
    expect(recalcularCostoItem(item, adultos, adolescentes, ninos)).toBe(250);
  });

  it('uses default calculation (cantidad * precio) for unknown method', () => {
    const item = makeItem({ nombreServicio: 'Otro', calculationMethod: undefined, cantidad: 2, precioUnitario: 150, precioUnitarioPresupuesto: 150 });
    expect(recalcularCostoItem(item, adultos, adolescentes, ninos)).toBe(300);
  });

  it('rounds the result to nearest integer', () => {
    const item = makeItem({ nombreServicio: 'Bebidas', calculationMethod: 'ratio', invitadosPorUnidad: 2, precioUnitario: 33, precioUnitarioPresupuesto: 33 });
    const result = recalcularCostoItem(item, 3, 0, 0);
    expect(result).toBe(Math.round(result));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateSuggestedQuantity
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateSuggestedQuantity', () => {
  it('returns totalGuests for porPersona', () => {
    const item = { nombreServicio: 'Catering', calculationMethod: 'porPersona' as const };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(100);
  });

  it('returns ceil(guests / ratio) for ratio method', () => {
    const item = { nombreServicio: 'Mesas', calculationMethod: 'ratio' as const, invitadosPorUnidad: 8 };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(Math.ceil(100 / 8));
  });

  it('returns item.cantidad for fijo method', () => {
    const item = { nombreServicio: 'Decoración', calculationMethod: 'fijo' as const, cantidad: 5 };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(5);
  });

  it('returns 1 for tramos method', () => {
    const item = { nombreServicio: 'Salón', calculationMethod: 'tramos' as const };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(1);
  });

  it('returns item.cantidad for default/unknown method', () => {
    const item = { nombreServicio: 'Otro', calculationMethod: undefined, cantidad: 3 };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(3);
  });

  it('returns 1 when cantidad is not set and method is fijo', () => {
    const item = { nombreServicio: 'Servicio', calculationMethod: 'fijo' as const };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(1);
  });

  it('handles invitadosPorUnidad = 0 for ratio (defaults to 1)', () => {
    const item = { nombreServicio: 'Sillas', calculationMethod: 'ratio' as const, invitadosPorUnidad: 0 };
    expect(calculateSuggestedQuantity(item, 80, 20)).toBe(100);
  });
});
