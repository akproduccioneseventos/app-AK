/**
 * MATAFUEGO — Auditoría 73 de Codex (orden 124 A, CAMPO73-RACE), 6/10/2026.
 *
 * Un operador o el cliente guardaba la fiesta con el plan de pagos IGUAL al que había leído; si
 * en el medio contabilidad cobraba una cuota, el guardado la volvía a cero diciendo que salió bien.
 * Lo de plata ahora se toma de la fiesta de ESE momento, adentro de la misma operación.
 *
 * Se probó rompiéndolo: con el guardado general de antes (reponer desde una lectura previa y
 * guardar aparte), las cuatro variantes se ponen en rojo.
 */
const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let usuario: any = null;
let cliente = false;
let antesDeMutar: (() => void) | null = null;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  // El cobro intercalado cae justo antes del guardado, sea cual sea el camino que guarde.
  writeData: jest.fn(async (archivo: string, datos: any) => { if (antesDeMutar) { antesDeMutar(); antesDeMutar = null; } almacen[archivo] = copia(datos); }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => { if (antesDeMutar) { antesDeMutar(); antesDeMutar = null; } almacen[archivo] = { ...almacen[archivo], ...copia(parcial) }; }),
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

// Contabilidad cobra la cuota justo entre la lectura de la pantalla y el guardado.
const cobrarEnElMedio = () => {
  antesDeMutar = () => {
    almacen['fiestas/f1.json'].planDePagos.cuotas[0] = cuota({ montoPagado: 1000, estado: 'pagado' });
  };
};

describe('CAMPO73-RACE: una pantalla vieja no deshace una cuota cobrada', () => {
  it.each([
    ['operador, de a partes', () => { usuario = OPERADOR_ASIGNADO; }, (f: any) => updateFiestaPartial('f1', { planDePagos: f.planDePagos, programa: [{ id: 'x' }] } as any)],
    ['operador, entera', () => { usuario = OPERADOR_ASIGNADO; }, (f: any) => saveFiesta({ ...f, programa: [{ id: 'x' }] })],
    ['cliente, de a partes', () => { cliente = true; }, (f: any) => updateFiestaPartial('f1', { planDePagos: f.planDePagos, decoracion: { tema: 'rosa' } } as any, { allowPortal: true })],
    ['cliente, entera', () => { cliente = true; }, (f: any) => saveFiesta({ ...f, decoracion: { tema: 'rosa' } })],
  ])('%s: el cobro queda y lo suyo se guarda', async (_n, quien, guardar) => {
    quien();
    const leida = copia(FIESTA); // lo que tenía la pantalla
    cobrarEnElMedio();
    const r = await guardar(leida);
    expect(r.success).toBe(true);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(1000);
    expect(fiesta().planDePagos.cuotas[0].estado).toBe('pagado');
    expect(fiesta().programa?.length || fiesta().decoracion).toBeTruthy();
  });

  it('control: sin mandar el plan, el cobro también queda', async () => {
    usuario = OPERADOR_ASIGNADO;
    cobrarEnElMedio();
    expect((await updateFiestaPartial('f1', { programa: [{ id: 'y' }] } as any)).success).toBe(true);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(1000);
  });

  it('contabilidad sigue guardando lo de plata por el guardado general', async () => {
    usuario = SECRETARIA;
    const r = await saveFiesta({ ...copia(FIESTA), planDePagos: { ...FIESTA.planDePagos, cuotas: [cuota({ montoPagado: 500, estado: 'parcial' })] } } as any);
    expect(r.success).toBe(true);
    expect(fiesta().planDePagos.cuotas[0].montoPagado).toBe(500);
  });
});
