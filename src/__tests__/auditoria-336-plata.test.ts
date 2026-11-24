/**
 * Auditoría 2da vuelta (Orden 336 — Secciones C y G):
 * Reglas de plata, facturación, cupones, rentabilidad, tope de IA,
 * permisos de operador, selección única por nombre y seguridad de asistentes.
 */
import * as fs from 'fs';
import * as path from 'path';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({
  getAdminFirestore: jest.fn(() => null),
  getAdminAuth: jest.fn(() => null),
  db: null,
  auth: null,
}));
jest.mock('@/lib/firebase/firestore', () => ({}));

const rootDir = path.resolve(__dirname, '..', '..');
const readRepoFile = (relPath: string) => fs.readFileSync(path.join(rootDir, relPath), 'utf8');

const resetMockedModules = (...mods: string[]) => {
  jest.resetModules();
  for (const mod of mods) {
    jest.dontMock(mod);
  }
};

describe('Orden 336 — Sección C: Plata, presupuestos, cupones y reportes', () => {
  beforeEach(() => {
    resetMockedModules(
      'next/cache',
      '@/lib/auth/require-session',
      '@/lib/auth/session-token',
      '@/lib/auth/solo-lectura',
      '@/lib/data-service',
      '@/app/actions/crm',
      '@/app/actions/invoices',
      '@/app/actions/presupuestos',
      '@/app/actions/fiesta/fiesta.actions',
      '@/lib/roles/leer-roles-interno',
      '@/app/actions/gastos',
    );
  });

  it('totalTrasCancelar excluye multas de cambio de fecha y cancelación del descuento', async () => {
    const { totalTrasCancelar, esMultaDeCancelacion } = await import('@/lib/budget/total-tras-cancelar');

    const items = [
      { idServicioCatalogo: 'serv_dj', costoTotalItem: 10000, esRegalo: false },
      { idServicioCatalogo: 'multa_cambio_fecha_123', costoTotalItem: 2000, esRegalo: false },
      { idServicioCatalogo: 'multa_cancelacion_456', costoTotalItem: 1000, esRegalo: false },
      { idServicioCatalogo: 'regalo_1', costoTotalItem: 500, esRegalo: true },
    ];

    expect(esMultaDeCancelacion(items[1])).toBe(true);
    expect(esMultaDeCancelacion(items[2])).toBe(true);
    expect(esMultaDeCancelacion(items[0])).toBe(false);

    // 10% sobre 10000 = 9000 + multas íntegras (2000 + 1000) = 12000
    expect(totalTrasCancelar(items, 'porcentaje', 10)).toBe(12000);
    // Monto fijo 2500 sobre 10000 = 7500 + 3000 = 10500
    expect(totalTrasCancelar(items, 'monto', 2500)).toBe(10500);
  });

  it('presupuesto Facturado bloquea cambios estructurales y borrado de pagos', async () => {
    const mockPresupuesto: any = {
      id: 'pres-fact-1',
      clienteNombre: 'Ana',
      estado: 'Facturado',
      invoiceId: 'inv-1',
      montoTotalCalculado: 50000,
      costoTotalEstimado: 50000,
      cantidadPersonas: 100,
      itemsPresupuestados: [
        { idServicioCatalogo: 's1', nombreServicio: 'DJ', cantidad: 1, precioUnitarioPresupuesto: 50000, costoTotalItem: 50000 },
      ],
      pagosCliente: [{ id: 'pago-1', monto: 20000, referencia: 'Factura F-001', fecha: '2026-11-01', metodoPago: 'Transferencia Bancaria' }],
      timestamp: '2026-10-01T12:00:00.000Z',
    };

    jest.doMock('next/cache', () => ({ revalidatePath: jest.fn() }));
    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn().mockResolvedValue({ success: true, user: { uid: 'u1', email: 'admin@ak.uy', permisos: ['contabilidad'] } }),
      verifySessionConPermiso: jest.fn().mockResolvedValue({ success: true, user: { uid: 'u1', email: 'admin@ak.uy', permisos: ['contabilidad'] } }),
    }));
    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn().mockResolvedValue({ uid: 'u1', email: 'admin@ak.uy' }),
      requirePermisoAlguno: jest.fn().mockResolvedValue({ uid: 'u1', email: 'admin@ak.uy' }),
      requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { uid: 'u1', email: 'admin@ak.uy' } }),
    }));
    jest.doMock('@/lib/auth/solo-lectura', () => ({ exigirQueSePuedaGuardar: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async (file: string, def: any) => (file === 'presupuestos.json' ? [JSON.parse(JSON.stringify(mockPresupuesto))] : def)),
      readDataConDetalle: jest.fn(async (file: string, def: any) => ({
        valor: file === 'presupuestos.json' ? [JSON.parse(JSON.stringify(mockPresupuesto))] : def,
        huboFalla: false,
      })),
      writeData: jest.fn().mockResolvedValue(undefined),
      getDataItem: jest.fn(async (_file: string, _col: string, id: string) =>
        id === 'pres-fact-1' ? JSON.parse(JSON.stringify(mockPresupuesto)) : null,
      ),
      mutateDataItem: jest.fn(async (_file: string, _col: string, id: string, fn: any) => {
        if (id !== 'pres-fact-1') return null;
        return fn(JSON.parse(JSON.stringify(mockPresupuesto)));
      }),
      createDataItem: jest.fn(),
    }));
    jest.doMock('@/app/actions/crm', () => ({
      ensureProspectoParaPresupuesto: jest.fn().mockResolvedValue(undefined),
      findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'l1' } }),
    }));

    const { updatePresupuesto, deletePagoFromPresupuesto } = await import('@/app/actions/presupuestos');

    const editRes = await updatePresupuesto({
      ...mockPresupuesto,
      montoTotalCalculado: 40000,
      costoTotalEstimado: 40000,
      itemsPresupuestados: [
        { idServicioCatalogo: 's1', nombreServicio: 'DJ', cantidad: 1, precioUnitarioPresupuesto: 40000, costoTotalItem: 40000 },
      ],
    });
    expect(editRes.success).toBe(false);
    expect(editRes.error).toMatch(/Facturado|facturado/i);

    const delRes = await deletePagoFromPresupuesto('pres-fact-1', 'pago-1');
    expect(delRes.success).toBe(false);
    expect(delRes.error).toMatch(/factura|Facturado/i);
  });

  it('registrarUsoCupon revalida montoMinimo en el servidor', async () => {
    const cupones: Record<string, any> = {
      'cup-min': {
        id: 'cup-min',
        codigo: 'PROMO10',
        activo: true,
        fechaInicio: '2020-01-01',
        fechaFin: '2099-12-31',
        usosMaximos: 10,
        usosActuales: 0,
        montoMinimo: 20000,
      },
    };
    const usages: Record<string, any> = {};

    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn().mockResolvedValue(undefined),
      requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async (file: string, def: any) => {
        if (file === 'cupones.json') return Object.values(cupones);
        if (file === 'cupones-usage.json') return Object.values(usages);
        return def;
      }),
      writeData: jest.fn(),
      mutateDataItem: jest.fn(async (_file: string, col: string, id: string, fn: any) => {
        if (col !== 'cupones' || !cupones[id]) return null;
        const next = fn(JSON.parse(JSON.stringify(cupones[id])));
        if (!next) return null;
        cupones[id] = next;
        return next;
      }),
      createDataItem: jest.fn(async (_file: string, col: string, id: string, item: any) => {
        if (col === 'cupones_usage') usages[id] = item;
      }),
    }));

    const { registrarUsoCupon } = await import('@/app/actions/cupones');

    const failRes = await registrarUsoCupon('cup-min', 'pres-1', 'Cliente Test', 1500, 15000);
    expect(failRes.success).toBe(false);
    expect(failRes.error).toMatch(/mínimo/i);
    expect(cupones['cup-min'].usosActuales).toBe(0);

    const okRes = await registrarUsoCupon('cup-min', 'pres-1', 'Cliente Test', 2000, 25000);
    expect(okRes.success).toBe(true);
    expect(cupones['cup-min'].usosActuales).toBe(1);
  });

  it('reportes de rentabilidad calculan costos pendientes igual que ganancia-evento', async () => {
    const fiesta = {
      id: 'f-rep-1',
      configuracion: {
        nombreEvento: 'Fiesta XV',
        fechaEvento: '2026-11-15',
        estado: 'Confirmado',
      },
      presupuestoContratado: {
        presupuestoId: 'p1',
        serviciosSeleccionados: [{ id: 's1', nombre: 'Sonido', precio: 100000 }],
        costoTotal: 100000,
      },
      personalAsignado: [
        { empleadoId: 'emp-1', empleadoNombre: 'Juan', rolId: 'rol-dj', eventSalary: 4500 },
      ],
      pagosProveedores: [
        { id: 'pp-1', costoAsociadoId: 'c1', monto: 2000, fecha: '2026-11-10', proveedorNombre: 'Proveedor X' },
      ],
      gestionCostos: {
        costosItems: [
          { id: 'c1', nombre: 'Extras', categoria: 'Extras', montoEstimado: 5000, cerrado: true },
        ],
      },
    };
    const roles = [{ id: 'rol-dj', nombre: 'DJ', sueldoPorEvento: 3000 }];

    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn().mockResolvedValue({ success: true, user: { uid: 'u1', permisos: ['ganancias'] } }),
    }));
    jest.doMock('@/lib/auth/require-session', () => ({
      requirePermisoAlguno: jest.fn().mockResolvedValue({ uid: 'u1' }),
      requireAppSession: jest.fn().mockResolvedValue({ uid: 'u1' }),
    }));
    jest.doMock('@/app/actions/invoices', () => ({ getInvoices: jest.fn().mockResolvedValue([]) }));
    jest.doMock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn().mockResolvedValue([]) }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: jest.fn().mockResolvedValue([fiesta]) }));
    jest.doMock('@/lib/roles/leer-roles-interno', () => ({ leerRolesInterno: jest.fn().mockResolvedValue(roles) }));
    jest.doMock('@/app/actions/gastos', () => ({ getGastosGenerales: jest.fn().mockResolvedValue([]) }));

    const { getProfitAndLossData } = await import('@/app/actions/reportes');
    const report = await getProfitAndLossData(
      { from: new Date('2026-11-01T00:00:00Z'), to: new Date('2026-11-30T23:59:59Z') },
      { fiestaId: 'f-rep-1' },
    );

    expect(report.success).toBe(true);
    // Pago real = 2000; item cerrado con pagado > 0 no suma pendiente; personal usa eventSalary (4500) => total costos = 6500
    expect(report.data?.costos.total).toBe(6500);
    const pendiente = report.data?.costos.detalle.find((d) => d.id === 'pendiente-costos-f-rep-1');
    expect(pendiente?.monto).toBe(4500);
  });

  it('verifica invariantes en simulador, vista de presupuesto, creación con cupón, activos fijos y CRM', () => {
    const simuladorSrc = readRepoFile('src/app/simulador-de-presupuesto/page.tsx');
    expect(simuladorSrc).toContain('handleGastronomicSelectionChange');
    expect(simuladorSrc).toContain('buildAnnualAdjustmentProjection');
    expect(simuladorSrc).toContain('setStep(5)');
    expect(simuladorSrc).toContain('setStep(4)');

    const verSrc = readRepoFile('src/app/(app)/presupuestos/[id]/ver/page.tsx');
    expect(verSrc).toContain('getYearFromDate');
    expect(verSrc).toContain('financials.total');
    expect(verSrc).toContain('precioUnitarioPresupuesto');

    const crearSrc = readRepoFile('src/app/(app)/presupuestos/nuevo/crear/page.tsx');
    expect(crearSrc).toContain('totalCalculado');
    expect(crearSrc).not.toContain('registrarUsoCupon(cuponAplicado.id, resultado.id, clienteNombre, descuentoAplicado, descuentoValorNum)');

    const reportesPageSrc = readRepoFile('src/app/(app)/empresa/contabilidad/reportes/page.tsx');
    expect(reportesPageSrc).toContain('rangoDelReporte?.from');

    const activosEditSrc = readRepoFile('src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx');
    expect(activosEditSrc).not.toContain('tramosDePrecio');
    expect(activosEditSrc).toContain('formData.cantidad');

    const crmSrc = readRepoFile('src/app/actions/crm.ts');
    expect(crmSrc).toContain('avisoDeLaSena');
  });
});

describe('Orden 336 — Sección G: IA, tope de gasto, permisos y asistentes', () => {
  beforeEach(() => {
    resetMockedModules(
      'next/cache',
      '@/lib/commercial/public-rate-limit',
      '@/lib/auth/solo-lectura',
      '@/lib/auth/require-session',
      '@/lib/auth/session-token',
      '@/lib/auth/perfiles',
      '@/lib/ai/consumo-servidor',
      '@/ai/genkit',
      '@/lib/data-service',
      '@/app/actions/presupuestos',
      '@/app/actions/dashboard',
      '@/app/actions/settings',
      '@/app/actions/customers',
      '@/app/actions/servicios-empresa',
      '@/ai/flows/assistant-flow',
      '@/ai/flows/generate-dj-profile-flow',
      '@/ai/flows/generate-timeline-flow',
      '@/ai/flows/extract-contract-data',
      '@/lib/fiesta/get-fiesta-raw',
      '@/lib/guest-portal-public-data',
      '@/app/actions/fiesta/fiesta.actions',
      '@/app/actions/notifications',
      '@/lib/auth/entertainment-token',
      '@/lib/entertainment/station-config',
      '@/lib/ai/gemini-image',
    );
  });

  it('modelos de marketing y comercial respetan tope de IA y bajan al modelo rápido', async () => {
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn().mockResolvedValue(false),
      reservarRespuestaProfunda: jest.fn().mockResolvedValue(false),
      registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
    }));

    const { getEffectiveGeminiModelForAgent, geminiFastModel } = await import('@/ai/genkit');
    const modelMkt = await getEffectiveGeminiModelForAgent('marketing', { deep: true });
    const modelCom = await getEffectiveGeminiModelForAgent('comercial', { deep: true });
    expect(geminiFastModel).toBeTruthy();
    expect(modelMkt).toBe(geminiFastModel);
    expect(modelCom).toBe(geminiFastModel);
  });

  it('applyFaceSwap consulta hayPresupuestoParaIA y corta antes de llamar a Gemini si superó el tope', async () => {
    process.env.GEMINI_API_KEY = 'test-touchpix-key';
    const hayPresupuestoParaIA = jest.fn().mockResolvedValue(false);
    const registrarConsumoIA = jest.fn().mockResolvedValue(undefined);
    const generateGeminiImage = jest.fn();

    jest.doMock('next/cache', () => ({ revalidatePath: jest.fn() }));
    jest.doMock('@/lib/commercial/public-rate-limit', () => ({
      enforcePublicRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
    }));
    jest.doMock('@/lib/auth/entertainment-token', () => ({
      hasEntertainmentGuestAccess: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock('@/lib/entertainment/station-config', () => ({
      getEntertainmentStationConfig: jest.fn(() => ({ enabled: true })),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn().mockResolvedValue({ id: 'f-tp-1' }),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA,
      registrarConsumoIA,
    }));
    jest.doMock('@/lib/ai/gemini-image', () => ({
      generateGeminiImage,
    }));

    const { applyFaceSwap } = await import('@/app/actions/touchpix-ai');
    const sourceFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])], 'foto.png', { type: 'image/png' });
    if (typeof (sourceFile as any).arrayBuffer !== 'function') {
      (sourceFile as any).arrayBuffer = async () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]).buffer;
    }
    const fd = new FormData();
    fd.append('fiestaId', 'f-tp-1');
    fd.append('consentAccepted', 'true');
    fd.append('characterId', 'superhero');
    fd.set('sourceFile', sourceFile);
    jest.spyOn(fd, 'get').mockImplementation((key: string) => {
      if (key === 'sourceFile') return sourceFile as any;
      if (key === 'fiestaId') return 'f-tp-1';
      if (key === 'consentAccepted') return 'true';
      if (key === 'characterId') return 'superhero';
      return null;
    });

    const res = await applyFaceSwap(fd);
    expect(hayPresupuestoParaIA).toHaveBeenCalled();
    expect(generateGeminiImage).not.toHaveBeenCalled();
    expect(registrarConsumoIA).not.toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.faceSwapApplied).toBe(false);
  });

  it('runMultiAgent respeta hayPresupuestoParaIA y devuelve modoRespaldo sin llamar a Gemini', async () => {
    const hayPresupuestoParaIA = jest.fn().mockResolvedValue(false);
    const registrarConsumoIA = jest.fn().mockResolvedValue(undefined);
    const generateWithGeminiFallback = jest.fn();

    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA,
      registrarConsumoIA,
    }));
    jest.doMock('@/ai/genkit', () => ({
      generateWithGeminiFallback,
      getEffectiveGeminiModelForAgent: jest.fn().mockResolvedValue('gemini-2.5-flash'),
      getGeminiGenerationConfigForAgent: jest.fn().mockReturnValue({}),
      getGeminiModelForAgent: jest.fn().mockReturnValue('gemini-2.5-flash'),
      ai: { defineFlow: (_cfg: any, fn: any) => fn },
    }));

    const { runMultiAgent } = await import('@/ai/flows/multiagent-flow');
    const out = await runMultiAgent({
      agentType: 'ventas',
      userMessage: 'Hola',
      mode: 'fast',
    } as any);

    expect(hayPresupuestoParaIA).toHaveBeenCalled();
    expect(generateWithGeminiFallback).not.toHaveBeenCalled();
    expect(registrarConsumoIA).not.toHaveBeenCalled();
    expect(out.modoRespaldo).toBe(true);
  });

  it('operador sin PERMISOS.CONTABILIDAD no ve totales en leer_presupuesto ni en contexto del asistente', async () => {
    // 1. Encargado (leer_presupuesto)
    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn().mockResolvedValue({ success: true, user: { uid: 'op-1', rol: 'operador', permisos: ['presupuestos:ver'] } }),
    }));
    jest.doMock('@/lib/auth/perfiles', () => ({
      PERMISOS: { CONTABILIDAD: 'contabilidad' },
      puede: jest.fn((_u: any, p: string) => p !== 'contabilidad'),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn().mockResolvedValue(false),
      registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@/app/actions/presupuestos', () => ({
      getPresupuestos: jest.fn().mockResolvedValue([
        {
          id: 'p-secret',
          clienteNombre: 'Lucía Gómez',
          estado: 'Enviado',
          montoTotalCalculado: 98765,
          totalConDescuento: 95000,
          cantidadPersonas: 80,
          itemsPresupuestados: [{ nombreServicio: 'DJ Pro', cantidad: 1, costoTotalItem: 98765 }],
        },
      ]),
    }));

    const { ejecutarEncargado } = await import('@/lib/multiagent/encargado');
    const encOut = await ejecutarEncargado({
      agentType: 'general',
      userMessage: 'Leé el presupuesto de Lucía Gómez',
    } as any);

    expect(JSON.stringify(encOut)).not.toContain('98765');
    expect(JSON.stringify(encOut)).not.toContain('95000');

    // 2. Assistant context
    resetMockedModules(
      '@/lib/auth/require-session',
      '@/lib/auth/session-token',
      '@/lib/auth/perfiles',
      '@/lib/auth/solo-lectura',
      '@/lib/ai/consumo-servidor',
      '@/app/actions/dashboard',
      '@/app/actions/settings',
      '@/app/actions/presupuestos',
      '@/app/actions/customers',
      '@/app/actions/servicios-empresa',
      '@/ai/flows/assistant-flow',
      '@/lib/data-service',
    );
    let capturedContext = '';
    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn().mockResolvedValue({ uid: 'op-1', rol: 'operador' }),
      requirePermisoAlguno: jest.fn().mockResolvedValue({ uid: 'op-1', rol: 'operador' }),
    }));
    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn().mockResolvedValue({ success: true, user: { uid: 'op-1', rol: 'operador' } }),
    }));
    jest.doMock('@/lib/auth/perfiles', () => ({
      PERMISOS: { CONTABILIDAD: 'contabilidad', ADMINISTRACION: 'administracion', CRM: 'crm', FIESTAS: 'fiestas' },
      puede: jest.fn(() => false),
    }));
    jest.doMock('@/lib/auth/solo-lectura', () => ({
      exigirQueSePuedaGuardar: jest.fn().mockResolvedValue(undefined),
      esSesionDeSoloLectura: jest.fn().mockResolvedValue(false),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
      registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@/app/actions/dashboard', () => ({
      getDashboardKpiData: jest.fn().mockResolvedValue({ success: true, data: { alerts: [] } }),
    }));
    jest.doMock('@/app/actions/settings', () => ({
      getCompanyInfo: jest.fn().mockResolvedValue({ companyName: 'AK Producciones' }),
      getAiAssistantSettings: jest.fn().mockResolvedValue({ knowledgeDocuments: [] }),
    }));
    jest.doMock('@/app/actions/presupuestos', () => ({
      getPresupuestos: jest.fn().mockResolvedValue([
        { id: 'p-1', numero: 101, clienteNombre: 'Lucía', eventoTipo: 'XV', estado: 'Enviado', totalConDescuento: 88888, costoTotalEstimado: 88888 },
      ]),
      savePresupuesto: jest.fn(),
      addPagoToPresupuesto: jest.fn(),
    }));
    jest.doMock('@/app/actions/customers', () => ({ getCustomers: jest.fn().mockResolvedValue([]), saveCustomer: jest.fn() }));
    jest.doMock('@/app/actions/servicios-empresa', () => ({
      getServiciosEmpresa: jest.fn().mockResolvedValue([
        { id: 's-1', nombre: 'DJ Pro', categoria: 'Música', valorUnitarioEstimado: 77777 },
      ]),
      saveServicioEmpresa: jest.fn(),
    }));
    jest.doMock('@/ai/flows/assistant-flow', () => ({
      chatWithAssistant: jest.fn(async (input: any) => {
        capturedContext = input.context || '';
        return { message: 'Ok', action: undefined };
      }),
    }));
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn().mockResolvedValue([]),
      writeData: jest.fn().mockResolvedValue(undefined),
    }));

    const { sendAssistantMessage } = await import('@/app/actions/assistant');
    await sendAssistantMessage('Resumime los últimos movimientos', []);

    expect(capturedContext).not.toContain('88888');
    expect(capturedContext).not.toContain('77777');
  });

  it('unoSoloPorNombre y executeGenerarContrato / executeRegistrarPago rechazan coincidencias ambiguas y validan confirmación', async () => {
    const { unoSoloPorNombre } = await import('@/lib/assistant/uno-solo-por-nombre');
    const lista = [{ nombre: 'Fiesta de Ana' }, { nombre: 'Fiesta de Juan' }];
    expect(unoSoloPorNombre(lista, (x) => [x.nombre], 'Fiesta')).toBeUndefined();
    expect(unoSoloPorNombre(lista, (x) => [x.nombre], 'Fi')).toBeUndefined();
    expect(unoSoloPorNombre(lista, (x) => [x.nombre], 'Ana')?.nombre).toBe('Fiesta de Ana');

    jest.doMock('next/cache', () => ({ revalidatePath: jest.fn() }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getAllFiestas: jest.fn().mockResolvedValue([
        { id: 'f1', configuracion: { nombreEvento: 'Fiesta de Ana', clienteNombre: 'Ana', fechaEvento: '2026-12-10' } },
        { id: 'f2', configuracion: { nombreEvento: 'Fiesta de Juan', clienteNombre: 'Juan', fechaEvento: '2026-12-15' } },
      ]),
    }));
    jest.doMock('@/app/actions/presupuestos', () => ({
      getPresupuestos: jest.fn().mockResolvedValue([
        { id: 'p1', numero: 1, clienteNombre: 'Ana Laura', estado: 'Aprobado', timestamp: '2026-11-01T10:00:00Z', costoTotalEstimado: 50000 },
        { id: 'p2', numero: 2, clienteNombre: 'Ana María', estado: 'Aprobado', timestamp: '2026-11-02T10:00:00Z', costoTotalEstimado: 60000 },
      ]),
      addPagoToPresupuesto: jest.fn(async (_id: string, pago: any) => ({ success: true, pago })),
    }));
    jest.doMock('@/app/actions/notifications', () => ({
      createNotification: jest.fn().mockResolvedValue(undefined),
    }));

    const { executeGenerarContrato, executeRegistrarPago } = await import('@/lib/assistant/tools/executors');

    const ambContrato = await executeGenerarContrato({ fiestaNombre: 'Fiesta' });
    expect(ambContrato.success).toBe(false);

    const sinConfirmar = await executeRegistrarPago({
      clienteNombre: 'Ana María',
      monto: 5000,
      metodoPago: 'Transferencia',
      confirmado: false,
    });
    expect(sinConfirmar.success).toBe(false);

    const ambiguoPago = await executeRegistrarPago({
      clienteNombre: 'Ana',
      monto: 5000,
      metodoPago: 'Transferencia',
    });
    expect(ambiguoPago.success).toBe(false);

    const pagoOk = await executeRegistrarPago({
      clienteNombre: 'Ana María',
      monto: 5000,
      metodoPago: 'Transferencia',
    });
    expect(pagoOk.success).toBe(true);
  });

  it('los 6 flujos adicionales chequean tope de IA', async () => {
    const hayPresupuestoParaIA = jest.fn().mockResolvedValue(false);
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA,
      registrarConsumoIA: jest.fn(),
    }));
    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn().mockResolvedValue({ uid: 'u1' }),
      requirePermisoAlguno: jest.fn().mockResolvedValue({ uid: 'u1' }),
    }));
    jest.doMock('@/ai/flows/generate-dj-profile-flow', () => ({ generateDjProfileFlow: jest.fn() }));
    jest.doMock('@/ai/flows/generate-timeline-flow', () => ({ generateTimelineFlow: jest.fn() }));
    jest.doMock('@/ai/flows/extract-contract-data', () => ({ extractContractData: jest.fn() }));

    const { generateDjProfileAction } = await import('@/app/actions/dj-ia.actions');
    const dj = await generateDjProfileAction('XV');
    expect(dj.success).toBe(false);

    const { generateTimelineAction } = await import('@/app/actions/timeline-ia.actions');
    const tl = await generateTimelineAction('XV', '21:00', 6, []);
    expect(tl.success).toBe(false);

    const { extractContractDataAction } = await import('@/app/actions/historicos');
    await expect(extractContractDataAction({ fileDataUri: 'data:application/pdf;base64,AA' })).rejects.toThrow(/Presupuesto de IA/);
  });

  it('chatWithGuestBot ignora datos de fiesta falsos del cliente y usa los del servidor con límite de 500 caracteres', async () => {
    process.env.GEMINI_API_KEY = 'test-guestbot-key';
    const generateWithGeminiFallback = jest.fn().mockResolvedValue({ text: '¡Hola! La fiesta arranca a las 21:00.' });
    jest.doMock('@/lib/commercial/public-rate-limit', () => ({
      enforcePublicRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
      registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn().mockResolvedValue({
        id: 'fiesta-real-1',
        configuracion: {
          nombreEvento: 'XV Reales',
          fechaEvento: '2026-12-20',
          horaInicio: '21:00',
          lugarEvento: 'Salón Real',
        },
      }),
    }));
    jest.doMock('@/lib/guest-portal-public-data', () => ({
      buildPublicGuestEvent: jest.fn(() => ({
        configuracion: {
          nombreEvento: 'XV Reales',
          nombreAgasajado: 'XV Reales',
          tipoCelebracion: 'XV',
          fechaEvento: '2026-12-20',
          horaInicio: '21:00',
          nombreLugar: 'Salón Real',
        },
        programa: [],
      })),
    }));
    jest.doMock('@/ai/genkit', () => ({
      generateWithGeminiFallback,
      geminiModel: 'gemini-2.5-flash',
      getGeminiModelForAgent: jest.fn().mockReturnValue('gemini-2.5-flash'),
    }));

    const { chatWithGuestBot } = await import('@/app/actions/salon-ia.actions');

    const longRes = await chatWithGuestBot('fiesta-real-1', 'x'.repeat(501), []);
    expect(longRes.success).toBe(false);
    expect(longRes.response).toMatch(/500/);

    const okRes = await chatWithGuestBot(
      { id: 'fiesta-real-1', configuracion: { nombreEvento: 'Falsa', lugarEvento: 'Fake' } } as any,
      '¿A qué hora es?',
      [],
    );
    expect(okRes.success).toBe(true);
    expect(generateWithGeminiFallback).toHaveBeenCalledTimes(1);
    const callUsed = JSON.stringify(generateWithGeminiFallback.mock.calls[0][0]);
    expect(callUsed).toContain('XV Reales');
    expect(callUsed).not.toContain('Fake');
  });

  it('chatConAsistenteInvitado exige guestAccessToken válido y límite de 500 caracteres', async () => {
    jest.doMock('@/lib/commercial/public-rate-limit', () => ({
      enforcePublicRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
      registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
      anotarFalloIA: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@/lib/fiesta/get-fiesta-raw', () => ({
      getFiestaById: jest.fn().mockResolvedValue({
        id: 'fiesta-inv-1',
        configuracion: { nombreEvento: 'Boda Sofi' },
        invitados: [{ id: 'inv-1', nombre: 'Carlos', mesa: 'Mesa 4', guestAccessToken: 'tok-ok' }],
      }),
    }));
    jest.doMock('@/lib/guest-portal-public-data', () => ({
      hasPublicGuestAccess: jest.fn((g: any, tok?: string) => !!g && g.guestAccessToken === tok),
    }));

    const { chatConAsistenteInvitado } = await import('@/app/actions/asistente-virtual');

    const noToken = await chatConAsistenteInvitado('fiesta-inv-1', [], 'Hola', undefined, undefined, {
      guestId: 'inv-1',
      guestAccessToken: 'malo',
    });
    expect(noToken.success).toBe(false);

    const tooLong = await chatConAsistenteInvitado('fiesta-inv-1', [], 'a'.repeat(501), undefined, undefined, {
      guestId: 'inv-1',
      guestAccessToken: 'tok-ok',
    });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error).toMatch(/500/);
  });

  it('decisiones.ts descarga URL https externa como inlineData y moderación de social-gallery usa === true', async () => {
    process.env.GEMINI_API_KEY = 'test-decisions-key';
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    let capturedBody: any = null;
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn().mockResolvedValue({ fastDecisionsEnabled: true }),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      reservarConsumoIA: jest.fn().mockResolvedValue({ ok: true }),
    }));

    fetchMock
      .mockImplementationOnce(async () => ({
        ok: true,
        headers: { get: () => 'image/jpeg' },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      }) as any)
      .mockImplementationOnce(async (_url: string, init: any) => {
        capturedBody = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            answers: {
              puntaje: { value: 8, score: 8 },
            },
          }),
        } as any;
      });

    const { decidir } = await import('@/lib/ai/decisiones');
    const res = await decidir({
      entradas: [{ url: 'https://firebasestorage.googleapis.com/v0/b/test/o/foto.jpg', mimeType: 'image/jpeg' }],
      preguntas: { puntaje: { tipo: 'nota', instruccion: 'Calificá la foto' } },
    });

    expect(res).not.toBeNull();
    expect(res?.puntaje?.nota).toBe(8);
    const parts = capturedBody.input.parts;
    expect(parts.some((p: any) => p.inlineData?.data)).toBe(true);
    expect(parts.some((p: any) => p.fileData)).toBe(false);

    const gallerySrc = readRepoFile('src/app/actions/social-gallery.ts');
    expect(gallerySrc).toContain('decision.apropiado?.siNo === true');
    expect(gallerySrc).toContain('decision.es_de_la_fiesta?.siNo === true');
    expect(gallerySrc).not.toContain('decision.apropiado?.siNo !== false');
    expect(gallerySrc).not.toContain('decision.es_de_la_fiesta?.siNo !== false');
  });

  it('assistant.ts rechaza montos o cantidades negativas en importación, factura y precios', () => {
    const assistantSrc = readRepoFile('src/app/actions/assistant.ts');
    expect(assistantSrc).toContain('!Number.isFinite(quantity) || quantity <= 0');
    expect(assistantSrc).toContain('!Number.isFinite(unitPrice) || unitPrice < 0');
    expect(assistantSrc).toContain('!Number.isFinite(nuevoPrecio) || nuevoPrecio <= 0');
    expect(assistantSrc).toContain('unoSoloPorNombre');

    const executorsSrc = readRepoFile('src/lib/assistant/tools/executors.ts');
    expect(executorsSrc).toContain('unoSoloPorNombre');
  });
});
