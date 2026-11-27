import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';
import { compararGanancias } from '@/lib/costos/comparativa';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'admin', perfil: 'admin' } })),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => true),
}));

const estadoFiesta = { current: null as any };
let costosGuardados: any = null;

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => estadoFiesta.current),
  saveFiesta: jest.fn(),
  updateFiestaPartial: jest.fn(),
}));
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: jest.fn(async () => ({ success: true })),
  mutarCostosInterno: jest.fn(async (_id: string, fn: any) => {
    costosGuardados = fn(estadoFiesta.current.gestionCostos || {});
    return { success: true };
  }),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => ({
    id: 'pres-1',
    invitadosAdultos: 100,
    invitadosAdolescentes: 0,
    invitadosNinos: 0,
    costoTotalEstimado: 50000,
    totalConDescuento: 50000,
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'dj-pro',
        nombreServicio: 'DJ Pro',
        cantidad: 1,
        costoTotalItem: 15000,
        categoriaServicio: 'Música',
      },
    ],
  })),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(async () => [
    {
      id: 'dj-pro',
      nombre: 'DJ Pro',
      categoria: 'Música',
      tipoCosto: 'Proveedor',
      calculationMethod: 'fijo',
      valorUnitarioEstimado: 8000,
    },
  ]),
}));
jest.mock('@/app/actions/insumos', () => ({
  getInsumos: jest.fn(async () => []),
}));
jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn(async () => []),
}));
jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => []),
}));

describe('El proveedor se cuenta una sola vez y comparativa incluye recargos (Orden 373 B2)', () => {
  it('syncAllEventCosts no duplica auto_prov_ si ya existe sync_budget_ con costoDeCatalogo, y ganancia-evento desduplica si existieran ambos', async () => {
    const { syncAllEventCosts } = await import('@/app/actions/fiesta/costos.actions');
    estadoFiesta.current = {
      id: 'fiesta-1',
      presupuestoId: 'pres-1',
      gestionCostos: {
        costosItems: [
          {
            id: 'sync_budget_dj-pro',
            nombre: 'DJ Pro',
            category: 'Música',
            montoEstimado: 8000,
            costoDeCatalogo: true,
          },
        ],
      },
    };

    const res = await syncAllEventCosts('fiesta-1');
    expect(res.success).toBe(true);
    const duplicados = (costosGuardados.costosItems || []).filter((i: any) => i.id.startsWith('auto_prov_'));
    expect(duplicados).toHaveLength(0);

    // Aunque ya vinieran duplicados de datos viejos, calcularGananciaDeEvento cuenta $8.000 una sola vez
    const ganancia = calcularGananciaDeEvento(
      {
        ingresosTotalesEstimados: 50000,
        costosItems: [
          { id: 'sync_budget_dj-pro', nombre: 'DJ Pro', category: 'Música', montoEstimado: 8000, costoDeCatalogo: true },
          { id: 'auto_prov_dj-pro', nombre: 'DJ Pro (Costo Proveedor)', category: 'Servicio Proveedor', montoEstimado: 8000 },
        ],
      } as any,
      [],
    );
    expect(ganancia.costoEstimado).toBe(8000);
    expect(ganancia.costoReal).toBe(8000);
  });

  it('compararGanancias suma recargosCobrados en total.gananciaReal cerrando con cada fiesta', () => {
    const fiestas = [
      {
        id: 'f1',
        configuracion: { nombreEvento: 'Casamiento Uno', tipoCelebracion: 'Casamiento', fechaEvento: '2026-08-15' },
        gestionCostos: { ingresosTotalesEstimados: 100000, costosItems: [] },
        pagosProveedores: [],
        presupuestoId: 'p1',
      },
    ] as any[];
    const cobros = new Map([
      [
        'p1',
        [
          {
            id: 'mp-1',
            monto: 50000,
            fecha: '2026-07-01',
            metodoPago: 'MercadoPago',
            estadoPago: 'confirmado',
            proveedorPago: 'mercadopago',
            comisionProveedor: 2000,
            recargoFinanciero: 5000,
          },
        ],
      ],
    ]) as any;

    const comp = compararGanancias(fiestas, cobros);
    expect(comp.fiestas).toHaveLength(1);
    expect(comp.total.gananciaReal).toBe(comp.fiestas[0].ganancia.gananciaReal);
    expect(comp.total.gananciaReal).toBe(103000);
  });
});
