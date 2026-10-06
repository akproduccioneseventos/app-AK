/**
 * MATAFUEGO — Auditoría 71 de Codex (orden 122), 6/10/2026.
 *
 * CAMPO01: un operador asignado, sin contabilidad, marcaba cuotas cobradas entrando por el
 *          guardado general de la fiesta (entero o de a partes).
 * CAMPO02: el cliente, desde su portal, marcaba el contrato en papel firmado, la fiesta
 *          "Contratada" y cuotas cobradas por ese mismo guardado.
 * COMPRA01: una pantalla vieja de compras mandaba la lista leída antes y deshacía un pago que
 *          contabilidad acababa de anotar.
 *
 * Se probó rompiéndolo: sacando `reponerLaPlata`/`pideCambiarLaPlata` del guardado general, y
 * volviendo `updateShoppingListStatus` a guardar la lista que manda la pantalla, se pone en rojo.
 * La base de mentira devuelve SIEMPRE una copia (error 11 de CLAUDE.md).
 */
const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let usuario: any = null;
let cliente = false;
let antesDeMutar: (() => void) | null = null;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => { almacen[archivo] = { ...almacen[archivo], ...copia(parcial) }; }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (usuario ? { success: true, user: usuario } : { success: false })),
}));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => cliente) }));
jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [{ id: 'e1', email: 'op@ak.test' }]),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => [copia(almacen['fiestas/f1.json'])]),
  leerHistorialCrudo: jest.fn(async () => []),
}));
// Como la base: la operación lee la fiesta de ESE momento. `antesDeMutar` mete un cambio de otro
// justo entre la lectura de la acción y la operación.
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, cambiar: (f: any) => any) => {
    if (antesDeMutar) { antesDeMutar(); antesDeMutar = null; }
    try {
      const nueva = await cambiar(copia(almacen[`fiestas/${id}.json`]));
      almacen[`fiestas/${id}.json`] = copia(nueva);
      return { success: true, updatedFiesta: nueva };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }),
}));

import { saveFiesta, updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';
import { updateShoppingListStatus } from '@/app/actions/fiesta/catering.actions';

const cuota = (extra: any = {}) => ({ id: 'c1', descripcion: 'Cuota 1', monto: 1000, montoPagado: 0, fechaVencimiento: '2026-11-01', estado: 'pendiente', ...extra });
const FIESTA = {
  id: 'f1',
  estado: 'En Planificacion',
  configuracion: { nombreEvento: 'XV de Sofía', fechaEvento: '2026-11-01' },
  clientPortalSettings: { enabled: true, accessKey: 'clave' },
  personalAsignado: [{ empleadoId: 'e1', rolId: 'dj' }],
  contratoFirmaInfo: { isSigned: false },
  planDePagos: { id: 'p', fiestaId: 'f1', cuotas: [cuota()], createdAt: 'a', updatedAt: 'a' },
  pagosProveedores: [],
  estadosCompra: [
    { proveedor: 'Carnes', proveedorId: 'prov1', pedido: true, pagado: false },
    { proveedor: 'Bebidas', proveedorId: 'prov2', pedido: false, pagado: false },
  ],
  programa: [],
};

const OPERADOR_ASIGNADO = { userId: 'e1', email: 'op@ak.test', perfil: 'operador' };
const SECRETARIA = { userId: 's1', email: 'sec@ak.test', perfil: 'secretaria' };
const fiesta = () => almacen['fiestas/f1.json'];
const CUOTA_COBRADA = { ...FIESTA.planDePagos, cuotas: [cuota({ montoPagado: 1000, estado: 'pagado' })] };

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f1.json'] = copia(FIESTA);
  usuario = null;
  cliente = false;
  antesDeMutar = null;
});

describe('CAMPO01: el operador no cobra por el guardado general', () => {
  it('de a partes: se rechaza y no se guarda nada', async () => {
    usuario = OPERADOR_ASIGNADO;
    const r = await updateFiestaPartial('f1', { planDePagos: CUOTA_COBRADA, programa: [{ id: 'x' }] } as any);
    expect(r.success).toBe(false);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(0);
    expect(fiesta().programa).toEqual([]);
  });

  it('entera: lo de plata queda como estaba y lo de organización se guarda', async () => {
    usuario = OPERADOR_ASIGNADO;
    const r = await saveFiesta({ ...copia(FIESTA), planDePagos: CUOTA_COBRADA, estado: 'Contratada', programa: [{ id: 'x' }],
      estadosCompra: [{ ...FIESTA.estadosCompra[0], pagado: true, montoPagado: 5000 }, FIESTA.estadosCompra[1]] } as any);
    expect(r.success).toBe(true);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(0);
    expect(fiesta().estado).toBe('En Planificacion');
    expect(fiesta().estadosCompra[0].pagado).toBe(false);
    expect(fiesta().estadosCompra[0].montoPagado).toBeUndefined();
    expect(fiesta().programa).toEqual([{ id: 'x' }]);
  });

  it('lo que no es plata lo sigue guardando de a partes', async () => {
    usuario = OPERADOR_ASIGNADO;
    expect((await updateFiestaPartial('f1', { programa: [{ id: 'y' }] } as any)).success).toBe(true);
    expect(fiesta().programa).toEqual([{ id: 'y' }]);
  });

  it('mandar lo de plata igual a lo guardado no se toma como un cambio', async () => {
    usuario = OPERADOR_ASIGNADO;
    expect((await updateFiestaPartial('f1', { planDePagos: copia(FIESTA.planDePagos), programa: [{ id: 'z' }] } as any)).success).toBe(true);
  });
});

describe('CAMPO02: el cliente no firma el papel ni cobra desde su portal', () => {
  it('de a partes con allowPortal: contrato, estado y cuota se rechazan', async () => {
    cliente = true;
    const r = await updateFiestaPartial('f1', {
      estado: 'Contratada',
      contratoFirmaInfo: { isSigned: true, method: 'physical' },
      planDePagos: CUOTA_COBRADA,
    } as any, { allowPortal: true });
    expect(r.success).toBe(false);
    expect(fiesta().estado).toBe('En Planificacion');
    expect(fiesta().contratoFirmaInfo.isSigned).toBe(false);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(0);
  });

  it.each([
    ['contrato en papel', { contratoFirmaInfo: { isSigned: true, method: 'physical' } }],
    ['estado Contratada', { estado: 'Contratada' }],
    ['cuota cobrada', { planDePagos: CUOTA_COBRADA }],
    ['factura enganchada', { invoiceIds: ['fac-1'] }],
  ])('entera: %s no se guarda', async (_n, cambio) => {
    cliente = true;
    const r = await saveFiesta({ ...copia(FIESTA), ...cambio } as any);
    expect(r.success).toBe(true);
    expect(fiesta().estado).toBe('En Planificacion');
    expect(fiesta().contratoFirmaInfo.isSigned).toBe(false);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(0);
    expect(fiesta().invoiceIds).toBeUndefined();
  });

  it('lo legítimo del cliente sigue pasando (la decoración, por ejemplo)', async () => {
    cliente = true;
    const r = await updateFiestaPartial('f1', { decoracion: { tema: 'rosa' } } as any, { allowPortal: true });
    expect(r.success).toBe(true);
    expect(fiesta().decoracion).toEqual({ tema: 'rosa' });
  });
});

describe('Quien tiene contabilidad sigue pudiendo', () => {
  it('la secretaria guarda lo de plata por el guardado general', async () => {
    usuario = SECRETARIA;
    expect((await updateFiestaPartial('f1', { planDePagos: CUOTA_COBRADA } as any)).success).toBe(true);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(1000);
  });
});

describe('COMPRA01: una pantalla vieja de compras no deshace un pago', () => {
  const leidos = () => copia(FIESTA.estadosCompra);

  it('pago primero: el operador marca "pedido" de otro proveedor y el pago queda', async () => {
    usuario = OPERADOR_ASIGNADO;
    const pantalla = leidos();
    const nuevos = copia(pantalla);
    nuevos[1].pedido = true;
    antesDeMutar = () => { almacen['fiestas/f1.json'].estadosCompra[0].pagado = true; };
    const r = await updateShoppingListStatus('f1', nuevos, pantalla);
    expect(r.success).toBe(true);
    expect(fiesta().estadosCompra[0].pagado).toBe(true);
    expect(fiesta().estadosCompra[1].pedido).toBe(true);
  });

  it('sin la lista leída (llamada vieja), un pago intercalado tampoco se deshace', async () => {
    usuario = OPERADOR_ASIGNADO;
    const nuevos = leidos();
    nuevos[1].pedido = true; // un cambio de organización, para que la operación corra
    antesDeMutar = () => { almacen['fiestas/f1.json'].estadosCompra[0].pagado = true; };
    const r = await updateShoppingListStatus('f1', nuevos);
    expect(r.success).toBe(true);
    expect(fiesta().estadosCompra[0].pagado).toBe(true);
  });

  it('pantalla vieja que cambia otra casilla del mismo proveedor no deshace su pago', async () => {
    usuario = SECRETARIA;
    const pantalla = leidos();
    almacen['fiestas/f1.json'].estadosCompra[0].pagado = true; // contabilidad cobró antes
    const nuevos = copia(pantalla);
    nuevos[0].pedido = false; // la pantalla vieja también tenía pagado:false
    nuevos[0].pagado = false;
    const r = await updateShoppingListStatus('f1', nuevos, pantalla);
    expect(r.success).toBe(true); // pagado no cambió respecto de lo leído: no se manda
    expect(fiesta().estadosCompra[0].pagado).toBe(true);
    expect(fiesta().estadosCompra[0].pedido).toBe(false);
  });

  it('cambio de pedido primero: otro marca el pedido y la pantalla vieja lo quiere sacar', async () => {
    usuario = SECRETARIA;
    const pantalla = leidos();
    antesDeMutar = () => { almacen['fiestas/f1.json'].estadosCompra[1].pedido = true; almacen['fiestas/f1.json'].estadosCompra[1].pagado = true; };
    const nuevos = copia(pantalla);
    nuevos[1].pagado = true;
    nuevos[1].montoPagado = 300;
    const r = await updateShoppingListStatus('f1', nuevos, pantalla);
    expect(r.success).toBe(true);
    expect(fiesta().estadosCompra[1].pedido).toBe(true);
  });

  it('el operador sin contabilidad no marca un pago', async () => {
    usuario = OPERADOR_ASIGNADO;
    const pantalla = leidos();
    const nuevos = copia(pantalla);
    nuevos[0].pagado = true;
    await expect(updateShoppingListStatus('f1', nuevos, pantalla)).resolves.toMatchObject({ success: false });
    expect(fiesta().estadosCompra[0].pagado).toBe(false);
  });

  it('dos proveedores cambiados por dos personas conservan los dos cambios', async () => {
    usuario = OPERADOR_ASIGNADO;
    const pantallaA = leidos();
    const pantallaB = leidos();
    const a = copia(pantallaA); a[1].pedido = true;
    const b = copia(pantallaB); b[0].entregadoParcial = true;
    await updateShoppingListStatus('f1', a, pantallaA);
    await updateShoppingListStatus('f1', b, pantallaB);
    expect(fiesta().estadosCompra[1].pedido).toBe(true);
    expect(fiesta().estadosCompra[0].entregadoParcial).toBe(true);
  });

  it('si otro desmarcó el pago recién, marcar "pagado" con la vieja no lo pisa en silencio', async () => {
    usuario = SECRETARIA;
    const pantalla = leidos();
    pantalla[0].pagado = true; // la pantalla lo vio pagado
    almacen['fiestas/f1.json'].estadosCompra[0].pagado = true;
    antesDeMutar = () => { almacen['fiestas/f1.json'].estadosCompra[0].montoPagado = 800; };
    const nuevos = copia(pantalla);
    nuevos[0].montoPagado = 500;
    const r = await updateShoppingListStatus('f1', nuevos, pantalla);
    expect(r.success).toBe(false);
    expect(fiesta().estadosCompra[0].montoPagado).toBe(800);
  });
});
