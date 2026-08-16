import { calcularTotalServicioLed } from '@/app/presentacion-led/lib/calculos';
import type { ServicioEmpresa } from '@/types/empresa';

function service(overrides: Partial<ServicioEmpresa>): ServicioEmpresa {
  return {
    id: 'service-1',
    nombre: 'Servicio',
    tipoItem: 'Servicio',
    categoria: 'Entretenimiento',
    ...overrides,
  };
}

describe('portal LED service totals', () => {
  it('calculates fixed, per-person, ratio and tiered services with the shared budget engine', () => {
    expect(calcularTotalServicioLed(service({ calculationMethod: 'fijo', precioVenta: 5000 }), 80, 20)).toBe(5000);
    expect(calcularTotalServicioLed(service({ calculationMethod: 'porPersona', precioPorPersona: 250 }), 80, 20)).toBe(25000);
    expect(calcularTotalServicioLed(service({ calculationMethod: 'ratio', precioBase: 1000, invitadosPorUnidad: 30 }), 80, 20)).toBe(4000);
    expect(calcularTotalServicioLed(service({
      calculationMethod: 'tramos',
      tramosDePrecio: [{ id: 'tier-1', desde: 1, hasta: 100, precio: 12000 }],
    }), 80, 20)).toBe(12000);
  });

  it('charges adult and child-only catering against the correct guest group', () => {
    expect(calcularTotalServicioLed(service({
      nombre: 'Plato principal',
      categoria: 'Servicio de catering',
      subcategoria: 'Plato Principal',
      calculationMethod: 'porPersona',
      precioPorPersona: 500,
    }), 80, 20)).toBe(40000);

    expect(calcularTotalServicioLed(service({
      nombre: 'Menu infantil',
      categoria: 'Servicio de catering',
      subcategoria: 'Menu Infantil',
      calculationMethod: 'porPersona',
      precioPorPersona: 300,
    }), 80, 20)).toBe(6000);
  });
});
