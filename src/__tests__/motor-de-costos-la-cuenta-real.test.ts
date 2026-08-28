/**
 * EL MOTOR DE COSTOS, PROBADO POR LOS NÚMEROS
 *
 * Es la cuenta de lo que le sale una fiesta a la empresa: sueldos con aportes,
 * comida por plato según a quién se le sirve, bebidas con merma, proveedores y
 * amortización. **No tenía ninguna prueba.** Una cuenta mal hecha acá no se ve
 * en pantalla: se ve en la ganancia a fin de mes.
 *
 * Estas pruebas comprueban los montos que quedan guardados.
 */

const guardado: { gestion: any } = { gestion: null };
const datos: any = {};

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => datos.fiesta),
  saveFiesta: jest.fn(async () => ({ success: true })),
  updateFiestaPartial: jest.fn(async (_id: string, parcial: any) => {
    guardado.gestion = parcial.gestionCostos;
    return { success: true };
  }),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => datos.presupuesto),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(async () => datos.servicios ?? []),
}));
jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn(async () => datos.menus ?? []),
}));
jest.mock('@/app/actions/roles', () => ({
  getRoles: jest.fn(async () => datos.roles ?? []),
}));
jest.mock('@/app/actions/insumos', () => ({
  getInsumos: jest.fn(async () => []),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ email: 'admin@ak', role: 'admin' })),
}));

function presupuestoCon(items: any[] = [], invitados = { adultos: 100, adolescentes: 0, ninos: 0 }) {
  return {
    id: 'pre1',
    invitadosAdultos: invitados.adultos,
    invitadosAdolescentes: invitados.adolescentes,
    invitadosNinos: invitados.ninos,
    itemsPresupuestados: items,
    costoTotalEstimado: 500000,
    totalConDescuento: 450000,
  };
}

async function correrElMotor() {
  const { syncAllEventCosts } = await import('@/app/actions/fiesta/costos.actions');
  return syncAllEventCosts('f1');
}

describe('El motor de costos: la cuenta real', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    guardado.gestion = null;
    datos.fiesta = { id: 'f1', presupuestoId: 'pre1' };
    datos.presupuesto = presupuestoCon();
    datos.servicios = [];
    datos.menus = [];
    datos.roles = [];
  });

  it('el sueldo del personal se carga CON los aportes patronales', async () => {
    datos.roles = [{ id: 'r1', sueldoPorEvento: 10000, porcentajeAportesPatronales: 20 }];
    datos.fiesta.personalAsignado = [{ rolId: 'r1' }];

    expect((await correrElMotor()).success).toBe(true);
    // 10.000 de sueldo + 20% de aportes = 12.000
    expect(guardado.gestion.others.totalPersonalCost).toBe(12000);
  });

  it('las bebidas se cargan con la merma del 5% y queda la línea que lo explica', async () => {
    datos.fiesta.bebidas = {
      categorias: [
        { activada: true, items: [{ costoUnitario: 100, cantidadNecesaria: 2 }] },
      ],
    };

    expect((await correrElMotor()).success).toBe(true);
    // 100 x 2 x 100 invitados = 20.000, más 5% = 21.000
    expect(guardado.gestion.others.totalBebidasCost).toBe(21000);
    const merma = guardado.gestion.costosItems.find((i: any) => i.id === 'auto_merma_bebidas');
    expect(merma.montoEstimado).toBe(1000);
  });

  it('una categoría de bebidas apagada no se cobra', async () => {
    datos.fiesta.bebidas = {
      categorias: [
        { activada: false, items: [{ costoUnitario: 100, cantidadNecesaria: 2 }] },
      ],
    };

    await correrElMotor();
    expect(guardado.gestion.others.totalBebidasCost).toBe(0);
  });

  it('lo que se regala NO se carga como costo de proveedor', async () => {
    datos.servicios = [
      { id: 's1', tipoCosto: 'Proveedor', valorUnitarioEstimado: 5000, calculationMethod: 'fijo' },
    ];
    datos.presupuesto = presupuestoCon([
      { idServicioCatalogo: 's1', nombreServicio: 'Fotos', cantidad: 1, esRegalo: true },
    ]);

    await correrElMotor();
    expect(guardado.gestion.others.totalProveedorCost).toBe(0);
  });

  it('un proveedor por persona se multiplica por los invitados, y uno por tanda se redondea para arriba', async () => {
    datos.servicios = [
      { id: 's1', tipoCosto: 'Proveedor', valorUnitarioEstimado: 300, calculationMethod: 'porPersona' },
      { id: 's2', tipoCosto: 'Proveedor', valorUnitarioEstimado: 8000, calculationMethod: 'ratio', invitadosPorUnidad: 30 },
    ];
    datos.presupuesto = presupuestoCon([
      { idServicioCatalogo: 's1', nombreServicio: 'Servicio de mesa', cantidad: 1 },
      { idServicioCatalogo: 's2', nombreServicio: 'Mozo', cantidad: 1 },
    ]);

    await correrElMotor();
    // 300 x 100 invitados = 30.000 ; 100/30 = 3,33 -> 4 mozos x 8.000 = 32.000
    expect(guardado.gestion.others.totalProveedorCost).toBe(62000);
  });

  it('lo que entra es el total CON descuento, no el de lista', async () => {
    await correrElMotor();
    expect(guardado.gestion.ingresosTotalesEstimados).toBe(450000);
  });

  it('sin presupuesto vinculado avisa, no guarda una cuenta inventada', async () => {
    datos.presupuesto = null;
    const resultado = await correrElMotor();

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/presupuesto/i);
    expect(guardado.gestion).toBeNull();
  });
});
