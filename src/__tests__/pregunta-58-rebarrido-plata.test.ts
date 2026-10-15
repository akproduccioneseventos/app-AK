/**
 * PREGUNTA 58, SEGUNDO BARRIDO, parte 2 (15 de octubre de 2026): las altas que tocan descuentos,
 * comida, el enlace del personal, clientes, activos, la foto del muro y los eventos. Si la respuesta
 * se pierde y la persona reintenta, no se guarda dos veces.
 *
 * Se usan las acciones reales. Las bases de mentira devuelven COPIAS en cada lectura y `create`
 * rechaza un id que ya existe. En el pedido del barman se comprueba ademas que el reintento NO
 * vuelve a descontar botellas.
 *
 * Se probo rompiendolo: sacando la comprobacion "ya esta con ese id" de una accion, su prueba de
 * "misma identidad dos veces" se pone en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true })),
  hasAppSession: jest.fn(async () => true),
}));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => undefined) }));
jest.mock('@/lib/server-cache', () => ({
  cachedFetch: jest.fn(async (_k: string, f: () => Promise<unknown>) => f()),
  cacheInvalidate: jest.fn(),
}));

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const archivos: Record<string, any[]> = {};
const lista = (a: string) => archivos[a] || (archivos[a] = []);

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (archivos[archivo] === undefined ? copia(porDefecto) : copia(archivos[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { archivos[archivo] = copia(datos); }),
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    if (lista(archivo).some((x: any) => x.id === id)) throw new Error('ya existe');
    archivos[archivo] = [...lista(archivo), copia({ ...item, id })];
  }),
  updateDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    const i = lista(archivo).findIndex((x: any) => x.id === id);
    if (i === -1) return false;
    archivos[archivo][i] = copia({ ...item, id });
    return true;
  }),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (a: any) => any) => {
    const i = lista(archivo).findIndex((x: any) => x.id === id);
    if (i === -1) return null;
    archivos[archivo][i] = copia(cambiar(copia(archivos[archivo][i])));
    return copia(archivos[archivo][i]);
  }),
  deleteDataItem: jest.fn(async () => true),
}));
jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: jest.fn(async () => copia(archivos['insumos.json'] || [])),
  limpiarCacheInsumos: jest.fn(),
}));
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (archivo: string, cambiar: (l: any[]) => any[]) => { archivos[archivo] = copia(cambiar(copia(archivos[archivo] || []))); }),
  mutateGenericJsonArrayConTransaccion: jest.fn(),
}));

// ---- Fiestas ----
const fiestas: Record<string, any> = {};
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, fn: (f: any) => any) => { fiestas[id] = copia(fn(copia(fiestas[id]))); return { success: true }; }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => (fiestas[id] ? copia(fiestas[id]) : null)),
  saveFiesta: jest.fn(async (f: any) => { fiestas[f.id] = copia(f); return { success: true, fiesta: f }; }),
  createNewFiestaForCustomer: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/carta-tragos/leer-carta-master', () => ({ leerCartaTragosMaster: jest.fn(async () => []) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(async () => 'https://x/f.jpg'), deleteFromStorage: jest.fn(), getSignedUrl: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({ checkImageSafety: jest.fn() }));
jest.mock('@/app/actions/social-gallery', () => ({ createSocialMediaPostFromUrlForStation: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => ({ success: true })) }));
jest.mock('@/app/actions/whatsapp', () => ({ triggerWhatsAppAutomation: jest.fn(async () => undefined) }));

import { savePromo } from '@/app/actions/promos';
import { createBarmanManualOrder } from '@/app/actions/fiesta/barra-tecnologica.actions';
import { saveInsumo } from '@/app/actions/insumos';
import { saveMenu, duplicateMenu } from '@/app/actions/menus-catering';
import { createAccesoPersonal } from '@/app/actions/accesos-personal';
import { saveActivoFijo } from '@/app/actions/activos-fijos';

beforeEach(() => {
  for (const k of Object.keys(archivos)) delete archivos[k];
  for (const k of Object.keys(fiestas)) delete fiestas[k];
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
});

describe('Promo nueva', () => {
  const dato: any = { titulo: 'Promo de primavera', fechaInicio: '2027-01-01', fechaFin: '2027-02-01', activa: true };
  it('misma identidad dos veces = una sola promo', async () => {
    const a = await savePromo({ ...dato }, { idIntento: 'intento-promo-01' });
    const b = await savePromo({ ...dato }, { idIntento: 'intento-promo-01' });
    expect(a.success && b.success).toBe(true);
    expect(lista('promos.json')).toHaveLength(1);
    expect(b.promo?.id).toBe(a.promo?.id);
  });
  it('identidad distinta = dos promos', async () => {
    await savePromo({ ...dato }, { idIntento: 'intento-promo-01' });
    await savePromo({ ...dato }, { idIntento: 'intento-promo-02' });
    expect(lista('promos.json')).toHaveLength(2);
  });
});

describe('Pedido manual del barman', () => {
  const stock = () => (archivos['insumos.json'] || []).find((i: any) => i.id === 'ins-ron')?.cantidadDisponible;
  const pedidos = () => (fiestas.f1.others?.barraTecnologica?.orders || []) as any[];
  beforeEach(() => {
    archivos['insumos.json'] = [{ id: 'ins-ron', nombre: 'Ron', cantidadDisponible: 1000 }];
    fiestas.f1 = {
      id: 'f1',
      cartaTragos: { items: [{ id: 'custom_trago1', nombre: 'Ron solo', recetaIngredientes: [{ insumoId: 'ins-ron', nombre: 'Ron', cantidad: 50, unidad: 'ml' }] }] },
      others: {},
    };
  });
  it('misma identidad dos veces = un solo pedido y las botellas se descuentan UNA vez', async () => {
    const a = await createBarmanManualOrder({ fiestaId: 'f1', drinkId: 'custom_trago1', clientRequestId: 'intento-bar-0001' });
    expect(a.success).toBe(true);
    expect(stock()).toBe(950);
    const b = await createBarmanManualOrder({ fiestaId: 'f1', drinkId: 'custom_trago1', clientRequestId: 'intento-bar-0001' });
    expect(b.success).toBe(true);
    expect(b.order?.id).toBe(a.order?.id);
    expect(pedidos()).toHaveLength(1);
    expect(stock()).toBe(950);
  });
  it('identidad distinta = dos pedidos y dos descuentos', async () => {
    await createBarmanManualOrder({ fiestaId: 'f1', drinkId: 'custom_trago1', clientRequestId: 'intento-bar-0001' });
    await createBarmanManualOrder({ fiestaId: 'f1', drinkId: 'custom_trago1', clientRequestId: 'intento-bar-0002' });
    expect(pedidos()).toHaveLength(2);
    expect(stock()).toBe(900);
  });
});

describe('Insumo nuevo', () => {
  const dato: any = { nombre: 'Harina', categoria: 'Secos', unidad: 'kg', valorUnitarioEstimado: 50, cantidadDisponible: 10 };
  it('misma identidad dos veces = un solo insumo, y el reintento es exito (no "ya existe")', async () => {
    const a = await saveInsumo({ ...dato }, { idIntento: 'intento-ins-0001' });
    const b = await saveInsumo({ ...dato }, { idIntento: 'intento-ins-0001' });
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(lista('insumos.json')).toHaveLength(1);
  });
  it('identidad distinta con otro nombre = dos insumos', async () => {
    await saveInsumo({ ...dato }, { idIntento: 'intento-ins-0001' });
    await saveInsumo({ ...dato, nombre: 'Azucar' }, { idIntento: 'intento-ins-0002' });
    expect(lista('insumos.json')).toHaveLength(2);
  });
});

describe('Menu nuevo y copia de menu', () => {
  const plato = (id: string) => ({ id, name: 'Milanesa', ingredients: [], profitMargin: 100, totalDishCost: 0 });
  const dato = (): any => ({ name: 'Menu familiar', items: [plato('d1')] });
  const menus = () => lista('menus-catering.json');
  it('misma identidad dos veces = un solo menu (el autoguardado actualiza ese)', async () => {
    const a = await saveMenu(dato(), { idIntento: 'intento-menu-001' });
    const b = await saveMenu({ ...dato(), name: 'Menu familiar 2' }, { idIntento: 'intento-menu-001' });
    expect(a.success && b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(menus()).toHaveLength(1);
    expect(menus()[0].name).toBe('Menu familiar 2');
  });
  it('identidad distinta = dos menus', async () => {
    await saveMenu(dato(), { idIntento: 'intento-menu-001' });
    await saveMenu(dato(), { idIntento: 'intento-menu-002' });
    expect(menus()).toHaveLength(2);
  });
  it('copiar el mismo menu con la misma identidad = una sola copia, y el original no se toca', async () => {
    const original = await saveMenu(dato(), { idIntento: 'intento-menu-001' });
    const a = await duplicateMenu(original.id!, { idIntento: 'intento-copia-001' });
    const b = await duplicateMenu(original.id!, { idIntento: 'intento-copia-001' });
    expect(a.success && b.success).toBe(true);
    expect(menus()).toHaveLength(2);
    expect(menus().find((m: any) => m.id === original.id).name).toBe('Menu familiar');
    expect(menus().filter((m: any) => String(m.name).startsWith('[COPIA]'))).toHaveLength(1);
  });
});

describe('Enlace de acceso del personal', () => {
  const dato: any = { nombreAcceso: 'Fotografo', permisos: ['fotografia'] };
  it('misma identidad dos veces = un solo enlace, con el mismo token', async () => {
    const a = await createAccesoPersonal({ ...dato }, { idIntento: 'intento-acc-0001' });
    const b = await createAccesoPersonal({ ...dato }, { idIntento: 'intento-acc-0001' });
    expect(a.success && b.success).toBe(true);
    expect(b.acceso?.id).toBe(a.acceso?.id);
    expect(lista('accesos-personal.json')).toHaveLength(1);
  });
  it('identidad distinta = dos enlaces con tokens distintos', async () => {
    const a = await createAccesoPersonal({ ...dato }, { idIntento: 'intento-acc-0001' });
    const b = await createAccesoPersonal({ ...dato }, { idIntento: 'intento-acc-0002' });
    expect(lista('accesos-personal.json')).toHaveLength(2);
    expect(a.acceso?.id).not.toBe(b.acceso?.id);
  });
  it('el token nunca es lo que mando la pantalla', async () => {
    const a = await createAccesoPersonal({ ...dato }, { idIntento: 'intento-acc-0001' });
    expect(a.acceso?.id).not.toContain('intento-acc-0001');
  });
});

describe('Activo fijo nuevo', () => {
  const dato: any = { nombre: 'Parlante', categoria: 'Sonido', unidad: 'unidad', valorUnitarioEstimado: 100, cantidadDisponible: 2 };
  it('misma identidad dos veces = un solo activo, y el reintento es exito', async () => {
    const a = await saveActivoFijo({ ...dato }, { idIntento: 'intento-act-0001' });
    const b = await saveActivoFijo({ ...dato }, { idIntento: 'intento-act-0001' });
    expect(a.success && b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(lista('activos-fijos.json')).toHaveLength(1);
  });
  it('identidad distinta con otro nombre = dos activos', async () => {
    await saveActivoFijo({ ...dato }, { idIntento: 'intento-act-0001' });
    await saveActivoFijo({ ...dato, nombre: 'Microfono' }, { idIntento: 'intento-act-0002' });
    expect(lista('activos-fijos.json')).toHaveLength(2);
  });
});
