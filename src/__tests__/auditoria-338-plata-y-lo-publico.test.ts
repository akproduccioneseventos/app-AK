/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';

// Mock state
let permitirGanancias = true;
let errorEnLecturaInvoices: Error | null = null;
const store: Record<string, any> = {};

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
  authAdmin: null,
  storageAdmin: null,
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' } })),
  requirePermisoAlguno: jest.fn(async () => {
    if (!permitirGanancias) {
      throw new Error('Tu perfil no tiene acceso a esta seccion.');
    }
    return true;
  }),
  requireAppSession: jest.fn(async () => ({ email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' }))
}));

jest.mock('@/app/actions/invoices', () => ({
  getInvoices: jest.fn(async () => {
    if (errorEnLecturaInvoices) {
      throw errorEnLecturaInvoices;
    }
    return [];
  })
}));

jest.mock('@/app/actions/gastos', () => ({
  getGastosGenerales: jest.fn(async () => [])
}));

jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => [])
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' } }))
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => undefined)
}));

jest.mock('@/lib/fiesta/costos-interno', () => ({
  mutarCostosInterno: jest.fn(async () => ({ success: true, updatedData: {} })),
  guardarCostosInterno: jest.fn(async () => ({ success: true }))
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => store[file] !== undefined ? JSON.parse(JSON.stringify(store[file])) : fallback),
  readDataConDetalle: jest.fn(async (file: string, fallback: any) => ({ valor: store[file] !== undefined ? JSON.parse(JSON.stringify(store[file])) : fallback, huboFalla: false })),
  writeData: jest.fn(async (file: string, data: any) => { store[file] = JSON.parse(JSON.stringify(data)); }),
  createDataItem: jest.fn(),
  updateDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
  deleteDataItem: jest.fn()
}));

jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: jest.fn(async () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/insumos.json'), 'utf8')))
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => store['fiestas'] ?? []),
  leerHistorialCrudo: jest.fn(async () => [])
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async (id: string) => store['fiestas/' + id + '.json'] ?? (store['fiestas'] ?? []).find((f: any) => f.id === id) ?? null)
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined)
}));

jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async () => ({ lead: { id: 'lead_338' } }))
}));

import { getProfitAndLossData } from '@/app/actions/reportes';
import { syncAllEventCosts } from '@/app/actions/fiesta/costos.actions';
import { comprasDelMenuAsignado } from '@/lib/compras/compras-del-menu-asignado';
import { consolidarCompras } from '@/lib/compras/consolidar-compras';
import { saveMenu, getMenusPublicos, duplicateMenu, deleteMenu, invalidateMenusCache } from '@/app/actions/menus-catering';
import { saveServicioEmpresa, getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { cacheInvalidate } from '@/lib/server-cache';

describe('Auditoría 338: Plata y Lo Público', () => {
  beforeEach(async () => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    permitirGanancias = true;
    errorEnLecturaInvoices = null;
    Object.keys(store).forEach(k => delete store[k]);
    cacheInvalidate('servicios-empresa-raw');
    await invalidateMenusCache().catch(() => {});
  });

  afterAll(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
  });

  test('Bloque 5.1: getProfitAndLossData maneja errores y permisos correctamente', async () => {
    errorEnLecturaInvoices = new Error('Conexión perdida con C:\\secreto\\db');
    const resError = await getProfitAndLossData({ from: new Date('2026-01-01'), to: new Date('2026-12-31') });
    expect(resError.success).toBe(false);
    expect(resError.codigoError).toMatch(/^REF-PL-/);
    expect(resError.error).toContain(resError.codigoError!);
    expect(resError.error).not.toContain('C:\\secreto\\db');
    expect(resError.error).not.toContain('Fallo al consolidar el reporte contable global');

    errorEnLecturaInvoices = null;
    permitirGanancias = false;
    const resPermiso = await getProfitAndLossData({ from: new Date('2026-01-01'), to: new Date('2026-12-31') });
    expect(resPermiso.success).toBe(false);
    expect(resPermiso.error).toContain('No tenés permiso de Contabilidad o Ganancias');
  });

  test('Bloque 5.2: finanzas.tsx no usa .catch(() => []) y muestra el mensaje de error de presupuestos', () => {
    const filePath = path.join(process.cwd(), 'src/components/contabilidad/panels/finanzas.tsx');
    const code = fs.readFileSync(filePath, 'utf8');
    expect(code).not.toContain('getPresupuestos(true).catch(() => [])');
    expect(code).toContain('No se pudieron leer los presupuestos');
  });

  test('Bloque 5.3: syncAllEventCosts detecta catering sin costo cargado', async () => {
    store['fiestas'] = [{
      id: 'f1',
      presupuestoId: 'p1',
      configuracion: { nombreEvento: 'Boda', fechaEvento: '2027-05-01' }
    }];
    store['fiestas/f1.json'] = store['fiestas'][0];
    store['presupuestos.json'] = [{
      id: 'p1',
      numero: 1,
      estado: 'Enviado',
      eventoFecha: '2027-05-01',
      itemsPresupuestados: [{
        id: 'it1',
        idServicioCatalogo: 'menu_1',
        nombreServicio: 'Catering Completo',
        categoriaServicio: 'Catering',
        cantidad: 100,
        precioUnitario: 1000,
        costoTotalItem: 100000
      }],
      costoTotalEstimado: 100000,
      totalConDescuento: 100000
    }];

    const res = await syncAllEventCosts('f1');
    expect(res.success).toBe(true);
    expect(res.cateringSinCostoCargado).toBe(true);
    expect(res.cateringAviso).toBe('Catering sin costo cargado: asigná el menú');
  });

  test('Bloque 5.4: comprasDelMenuAsignado y consolidarCompras manejan porEvento y cantidad necesaria', async () => {
    const insumosPath = path.join(process.cwd(), 'src/data/insumos.json');
    const insumosJson = JSON.parse(fs.readFileSync(insumosPath, 'utf8'));
    const ingGas = insumosJson.find((i: any) => i.id === 'ing-gas');
    expect(ingGas?.porEvento).toBe(true);

    const items = [];
    for (let i = 1; i <= 22; i++) {
      items.push({
        id: 'p-' + i,
        name: 'Plato ' + i,
        type: 'Plato Principal',
        ingredients: [{ id: 'i-' + i, origenId: 'ing-gas', name: 'Gas Garrafa 13 Kg', quantityPerPerson: '1', unit: 'Kg' }],
        totalDishCost: 50,
        suggestedSellingPrice: 100
      });
    }

    const menu = {
      id: 'm-test',
      name: 'Menu Gas',
      description: 'Prueba gas',
      items
    };

    const resCompras = comprasDelMenuAsignado(menu as any, new Set(), 120, insumosJson);
    const consolidado = consolidarCompras(resCompras.compras, { totalInvitados: 120, aplicarMinimoStock: false });
    const gas = consolidado.find((c: any) => c.origenId === 'ing-gas');
    expect(gas).toBeDefined();
    expect(gas!.cantidadNecesaria).toBe(1);
  });

  test('Bloque 6.1: mi-mesa page.tsx no incluye token en URL y muestra mensaje institucional', () => {
    const filePath = path.join(process.cwd(), 'src/app/evento/mi-mesa/[fiestaId]/page.tsx');
    const code = fs.readFileSync(filePath, 'utf8');
    expect(code).not.toContain('&token=${encodeURIComponent(token)}');
    expect(code).toContain('Para entrar a la fiesta abrí tu invitación (WhatsApp o correo)');
  });

  test('Bloque 6.2 & P226: ciclo de vida de menus y servicios empresa (borrador / publicos / legacy)', async () => {
    store['menus-catering.json'] = [{
      id: 'legacy-1',
      name: 'Menu Legacy',
      description: 'Viejito',
      items: [
        { id: 'p-leg-1', name: 'Entrada Legacy', type: 'Entrada', ingredients: [], totalDishCost: 100, suggestedSellingPrice: 200 },
        { id: 'p-leg-2', name: 'Principal Legacy', type: 'Plato Principal', ingredients: [], totalDishCost: 200, suggestedSellingPrice: 400 }
      ]
    }];
    store['servicios-empresa.json'] = [{
      id: 'srv-legacy',
      nombre: 'Sonido Legacy',
      categoria: 'Servicio de discoteca',
      tipoItem: 'Servicio',
      precioVenta: 10000
    }];

    const newMenuRes = await saveMenu({
      name: 'Menu Prueba Auditor',
      description: 'Nuevo',
      items: [{ id: 'p-new', name: 'Plato Borrador', type: 'Plato Principal', ingredients: [], totalDishCost: 50, suggestedSellingPrice: 100 }]
    } as any);
    cacheInvalidate('servicios-empresa-raw');
    await invalidateMenusCache();
    expect(newMenuRes.menu?.estadoPublicacion).toBe('borrador');

    const menusPublicos1 = await getMenusPublicos();
    expect(menusPublicos1.some((m: any) => m.id === newMenuRes.menu?.id)).toBe(false);
    expect(menusPublicos1.some((m: any) => m.id === 'legacy-1')).toBe(true);

    const updateLegacyRes = await saveMenu({
      id: 'legacy-1',
      name: 'Menu Legacy',
      description: 'Viejito',
      items: [{ id: 'p-leg-1', name: 'Entrada Legacy', type: 'Entrada', ingredients: [], totalDishCost: 100, suggestedSellingPrice: 200 }]
    } as any);
    cacheInvalidate('servicios-empresa-raw');
    await invalidateMenusCache();
    expect(updateLegacyRes.menu?.id).toBe('legacy-1');

    const menusPublicos2 = await getMenusPublicos();
    const legacyFound = menusPublicos2.find((m: any) => m.id === 'legacy-1');
    expect(legacyFound).toBeDefined();
    expect(legacyFound?.items?.length).toBe(1);

    const newSrvRes = await saveServicioEmpresa({
      nombre: 'Foto Prueba Auditor',
      categoria: 'Servicio de fotografía',
      tipoItem: 'Servicio',
      precioVenta: 5000
    } as any);
    cacheInvalidate('servicios-empresa-raw');
    await invalidateMenusCache();
    expect(newSrvRes.servicio?.estadoPublicacion).toBe('borrador');

    const srvPublicos = await getServiciosEmpresaPublicos();
    expect(srvPublicos.some((s: any) => s.id === newSrvRes.servicio?.id)).toBe(false);
    expect(srvPublicos.some((s: any) => s.id === 'srv-legacy')).toBe(true);

    const dupRes = await duplicateMenu('legacy-1');
    cacheInvalidate('servicios-empresa-raw');
    await invalidateMenusCache();
    expect(dupRes.menu?.estadoPublicacion).toBe('borrador');
  });

  test('Bloque 6.3: deleteMenu previene borrado si está en uso en presupuesto o fiesta', async () => {
    store['menus-catering.json'] = [{ id: 'm-uso', name: 'Menu en uso', items: [] }];
    store['presupuestos.json'] = [{
      id: 'p1',
      numero: 88,
      clienteNombre: 'Lucía Test',
      selectedMenuId: 'm-uso',
      itemsPresupuestados: []
    }];
    store['fiestas'] = [{
      id: 'f1',
      configuracion: { nombreEvento: '15 de Sofía' },
      menuAsignadoId: 'm-uso'
    }];

    const res = await deleteMenu('m-uso');
    expect(res.success).toBe(false);
    expect(res.error).toContain('#88');
    expect(res.error).toContain('Lucía Test');
    expect(res.error).toContain('15 de Sofía');
  });
});
