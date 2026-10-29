jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(), writeData: jest.fn() }));
jest.mock('@/lib/budget/financial-guardrails', () => ({ normalizePresupuestoFinancials: jest.fn(value => value) }));
jest.mock('@/lib/commercial/acquisition', () => ({
  sanitizeCommercialAttribution: jest.fn(() => ({ source: 'facebook' })),
}));
jest.mock('@/lib/commercial/simulator-conversion-engine', () => ({
  buildSimulatorConversionPlan: jest.fn(() => ({})),
}));
jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async () => ({ lead: { id: 'lead-test' } })),
}));
jest.mock('@/lib/commercial/contact', () => ({ normalizeUruguayPhone: jest.fn(() => '099123456') }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/simulator/pricing', () => ({
  calculateSimulatorPricing: jest.fn(),
  simulatorDetailsToBudgetItems: jest.fn(() => [{
    idServicioCatalogo: 'service-1', nombreServicio: 'Servicio real', cantidad: 1,
    precioUnitario: 0, precioUnitarioPresupuesto: 0, costoTotalItem: 0,
  }]),
}));
jest.mock('@/lib/simulator/catalog', () => ({
  buildAuthoritativeSimulatorServices: jest.fn(() => [{ id: 'service-1', nombre: 'Servicio real' }]),
}));
jest.mock('@/lib/simulator/package-customization', () => ({
  getRemovablePackageServices: jest.fn(() => []),
}));

import { readData, writeData } from '@/lib/data-service';
import { calculateSimulatorPricing } from '@/lib/simulator/pricing';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { persistPublicSimulatorBudget } from './public-simulator-persistence';

const read = readData as jest.Mock;
const write = writeData as jest.Mock;
const price = calculateSimulatorPricing as jest.Mock;
const upsertLead = upsertPublicCommercialLead as jest.Mock;

const submission = {
  submissionId: 'commercial-draft-255-0001',
  clienteNombre: 'Cliente de prueba',
  clienteContacto: '099123456',
  eventoFecha: '2027-03-15',
  adultos: 100,
  ninos: 0,
  subtotal: 0,
  costoEstimado: 0,
  serviciosIncluidos: ['service-1'],
  selectedServiceIds: ['service-1'],
};

function priced(totalFinal: number) {
  price.mockReturnValue({
    totalFinal,
    subtotalVenta: totalFinal,
    discountPercentage: 0,
    annualProjection: { applies: false, adjustmentPct: 0 },
    detallados: [{ id: 'service-1', nombre: 'Servicio real' }],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  read.mockImplementation(async (file: string) => {
    if (file === 'armado-rapido-config.json') return { paquetes: [], serviceDependencies: [] };
    if (file === 'servicios-empresa.json' || file === 'menus-catering.json') return [];
    if (file === 'budget-display-settings.json') return {};
    return [];
  });
});

afterAll(() => {
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
});

describe('public simulator persistence positive-total guard', () => {
  it('rejects zero authoritative pricing before CRM upsert or any budget write', async () => {
    priced(0);
    await expect(persistPublicSimulatorBudget(submission, {
      source: 'simulator_assistant',
      eventoTipo: 'Boda',
      estadoInicial: 'Borrador',
      requirePositiveTotal: true,
    })).rejects.toThrow('no produjo un importe positivo');
    expect(upsertLead).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalledWith('presupuestos.json', []);
  });

  it('keeps the public simulator default status unchanged', async () => {
    priced(25000);
    const result = await persistPublicSimulatorBudget(submission, {
      source: 'simulator',
      eventoTipo: 'Boda',
    });
    expect(result.presupuesto.estado).toBe('Pendiente Verificación');
    expect(upsertLead).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('presupuestos.json', expect.arrayContaining([
      expect.objectContaining({ estado: 'Pendiente Verificación', totalConDescuento: 25000 }),
    ]));
  });
});
