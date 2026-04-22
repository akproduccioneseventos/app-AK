import { calculateMenuSimulationTotals, resolveMenuUnitPrices } from '@/lib/portal-menu-simulator';
import type { Presupuesto } from '@/types/presupuesto';

describe('portal-menu-simulator', () => {
  it('resuelve precios unitarios por menú adulto y niños/adolescentes', () => {
    const presupuesto = {
      invitadosCantidad: 100,
      costoTotalEstimado: 150000,
      totalConDescuento: 140000,
      itemsPresupuestados: [
        { idServicioCatalogo: '1', nombreServicio: 'Menú Adulto Premium', cantidad: 70, precioUnitario: 1200, precioUnitarioPresupuesto: 1200, costoTotalItem: 84000 },
        { idServicioCatalogo: '2', nombreServicio: 'Menú niños y adolescentes', cantidad: 30, precioUnitario: 800, precioUnitarioPresupuesto: 800, costoTotalItem: 24000 },
      ],
    } as Presupuesto;

    const result = resolveMenuUnitPrices(presupuesto);
    expect(result.adultUnit).toBeCloseTo(1200, 0);
    expect(result.kidsUnit).toBeCloseTo(800, 0);
  });

  it('calcula aumentos y nuevo total', () => {
    const result = calculateMenuSimulationTotals({
      adultosDelta: 10,
      ninosAdolescentesDelta: 5,
      adultUnitPrice: 1200,
      kidsUnitPrice: 800,
      currentTotal: 140000,
    });

    expect(result.aumentoAdultos).toBe(12000);
    expect(result.aumentoKids).toBe(4000);
    expect(result.aumentoTotal).toBe(16000);
    expect(result.nuevoTotal).toBe(156000);
  });
});
