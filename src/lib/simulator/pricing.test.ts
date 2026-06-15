import { calculateSimulatorPricing, simulatorDetailsToBudgetItems } from './pricing';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const services: ServicioEmpresa[] = [
  {
    id: 'dj',
    nombre: 'Discoteca',
    tipoItem: 'Servicio',
    categoria: 'Servicio de discoteca',
    calculationMethod: 'fijo',
    precioVenta: 10000,
    cantidad: 20,
  },
  {
    id: 'foto',
    nombre: 'Fotografia',
    tipoItem: 'Servicio',
    categoria: 'Servicio de fotografía',
    calculationMethod: 'fijo',
    precioVenta: 5000,
  },
  {
    id: 'menu',
    nombre: 'Menu principal',
    tipoItem: 'Servicio',
    categoria: 'Servicio de catering',
    subcategoria: 'Plato Principal',
    calculationMethod: 'porPersona',
    precioPorPersona: 1000,
  },
];

const config: ArmadoRapidoConfig = {
  menus: [],
  paquetes: [{
    id: 'base',
    nombre: 'Base',
    serviciosIncluidos: [
      { id: 'dj' },
      { id: 'foto', esRegalo: true },
    ],
  }],
  descuentoGeneral: 10,
};

describe('simulator pricing', () => {
  it('produces the same result for manual and AI selections', () => {
    const common = {
      config,
      services,
      adultos: 50,
      ninosYAdolescentes: 0,
      selectedPaqueteId: 'base',
      eventoFecha: '2026-10-10',
      annualAdjustmentPercentage: 15,
      currentYear: 2026,
    };

    const manual = calculateSimulatorPricing({
      ...common,
      selectedServices: [{ id: 'menu' }],
    });
    const ai = calculateSimulatorPricing({
      ...common,
      selectedServices: [{ id: 'menu' }],
    });

    expect(ai).toEqual(manual);
    expect(ai.totalFinal).toBe(54000);
    expect(ai.ahorroRegalos).toBe(5000);
    expect(ai.detallados.find((item) => item.id === 'dj')?.cantidad).toBe(1);
  });

  it('keeps annual adjustment informative and outside the saved current total', () => {
    const result = calculateSimulatorPricing({
      config,
      services,
      adultos: 50,
      ninosYAdolescentes: 0,
      selectedPaqueteId: 'base',
      selectedServices: [{ id: 'menu' }],
      eventoFecha: '2027-10-10',
      annualAdjustmentPercentage: 15,
      currentYear: 2026,
    });

    expect(result.totalFinal).toBe(54000);
    expect(result.totalProyectado).toBe(62100);
    expect(result.ajusteAnual).toBe(8100);
  });

  it('does not charge a package gift selected again as an extra', () => {
    const result = calculateSimulatorPricing({
      config,
      services,
      adultos: 50,
      ninosYAdolescentes: 0,
      selectedPaqueteId: 'base',
      selectedServices: [{ id: 'foto', esRegalo: false }],
      annualAdjustmentPercentage: 15,
    });

    expect(result.subtotalVenta).toBe(10000);
    expect(result.ahorroRegalos).toBe(5000);
  });

  it('preserves calculation metadata in generated budget items', () => {
    const result = calculateSimulatorPricing({
      config,
      services,
      adultos: 50,
      ninosYAdolescentes: 0,
      selectedServices: [{ id: 'menu' }],
      annualAdjustmentPercentage: 15,
    });

    expect(simulatorDetailsToBudgetItems(result.detallados)).toEqual([
      expect.objectContaining({
        idServicioCatalogo: 'menu',
        cantidad: 50,
        calculationMethod: 'porPersona',
        precioPorPersona: 1000,
        subcategoria: 'Plato Principal',
      }),
    ]);
  });
});
