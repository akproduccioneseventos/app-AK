/** @jest-environment node */
/**
 * MATAFUEGO - Mantenimiento de equipos: reintento y dos operadores (orden 159, 12/10/2026).
 *
 * 1. Se perdia la respuesta, la persona tocaba de nuevo y quedaban DOS filas y DOS gastos.
 * 2. Dos operadores anotando a la vez: la accion leia, copiaba y escribia todo el historial, y
 *    una fila desaparecia (con su gasto huerfano).
 * 3. Guardar la ficha del equipo con el formulario viejo borraba lo que otro habia anotado.
 *
 * El almacenamiento de mentira devuelve COPIAS y corre las transacciones de a una, como la base.
 * Cada arreglo se probo rompiendolo a proposito (ver pie del archivo).
 */
import fs from 'fs';
import path from 'path';

type Equipo = { id: string; nombre: string; categoria: string; unidad: string; mantenimiento?: any; [k: string]: any };

let equipo: Equipo;
const gastos = new Map<string, any>();
let barrera: { esperar: () => Promise<void> } | null = null;

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn(async () => ({ userId: 'u1' })),
}));
jest.mock('@/lib/auth/perfiles', () => ({ PERMISOS: { INSUMOS: 'insumos', ORGANIZACION: 'organizacion' } }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => {
    const vista = [copia(equipo)];
    if (barrera) await barrera.esperar();
    return vista;
  }),
  createDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
  // Transacciones de a una: cada una lee lo ultimo guardado y escribe de inmediato.
  mutateDataItem: jest.fn(async (_f: string, _c: string, id: string, cambiar: (a: any) => any) => {
    if (equipo.id !== id) return null;
    const nuevo = cambiar(copia(equipo));
    if (!nuevo) return null;
    equipo = copia(nuevo);
    return copia(equipo);
  }),
}));
jest.mock('@/app/actions/gastos', () => ({
  // Igual que el de verdad: la misma llave devuelve el gasto que ya existe.
  saveGastoGeneral: jest.fn(async (g: any) => {
    const previo = gastos.get(g.idempotencyKey);
    if (previo) return { success: true, gasto: previo };
    gastos.set(g.idempotencyKey, copia(g));
    return { success: true, gasto: g };
  }),
}));

function crearBarrera(n: number) {
  let llegaron = 0;
  let liberar!: () => void;
  const todos = new Promise<void>(r => { liberar = r; });
  return { esperar: async () => { llegaron += 1; if (llegaron >= n) liberar(); await todos; } };
}

beforeEach(() => {
  equipo = { id: 'eq1', nombre: 'Parlante', categoria: 'Sonido', unidad: 'unidad', mantenimiento: { cadaDias: 90, historial: [] } };
  gastos.clear();
  barrera = null;
});

const hist = () => equipo.mantenimiento?.historial ?? [];

describe('Mantenimiento: reintento y dos operadores', () => {
  it('(a) la misma operacion enviada dos veces (respuesta perdida): 1 registro y 1 gasto', async () => {
    const { registrarMantenimientoDeEquipo } = await import('@/app/actions/activos-fijos');
    const datos = { fecha: '2026-10-12', nota: 'Cambio de lampara', costo: 123.45, registroId: 'mant_op1' };
    const r1 = await registrarMantenimientoDeEquipo('eq1', datos);
    const r2 = await registrarMantenimientoDeEquipo('eq1', datos);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r2.yaEstaba).toBe(true);
    expect(hist()).toHaveLength(1);
    expect(gastos.size).toBe(1);
    expect(hist()[0].gastoPendiente).toBe(false);
  });

  it('(a2) un pendiente reintentado conserva su id y registra el costo una sola vez', async () => {
    const { registrarMantenimientoDeEquipo } = await import('@/app/actions/activos-fijos');
    const gastosMod = await import('@/app/actions/gastos');
    (gastosMod.saveGastoGeneral as jest.Mock).mockResolvedValueOnce({ success: false, error: 'se cayo' });
    const datos = { fecha: '2026-10-12', nota: 'Service', costo: 500, registroId: 'mant_op2' };
    const r1 = await registrarMantenimientoDeEquipo('eq1', datos);
    expect(r1.gastoPendiente).toBe(true);
    expect(hist()[0].gastoPendiente).toBe(true);
    const r2 = await registrarMantenimientoDeEquipo('eq1', datos);
    expect(r2.success).toBe(true);
    expect(hist()).toHaveLength(1);
    expect(hist()[0].gastoPendiente).toBe(false);
    expect(gastos.size).toBe(1);
  });

  it('(b) dos trabajos distintos con el mismo texto, fecha y costo: 2 registros y 2 gastos', async () => {
    const { registrarMantenimientoDeEquipo } = await import('@/app/actions/activos-fijos');
    const base = { fecha: '2026-10-12', nota: 'Lubricacion', costo: 100 };
    await registrarMantenimientoDeEquipo('eq1', { ...base, registroId: 'mant_a' });
    await registrarMantenimientoDeEquipo('eq1', { ...base, registroId: 'mant_b' });
    expect(hist()).toHaveLength(2);
    expect(gastos.size).toBe(2);
  });

  it('(c) dos operadores intercalados: 2 filas, 2 gastos y ids cruzados correctos', async () => {
    const { registrarMantenimientoDeEquipo } = await import('@/app/actions/activos-fijos');
    barrera = crearBarrera(2); // los dos leen el equipo antes de que cualquiera escriba
    const [ra, rb] = await Promise.all([
      registrarMantenimientoDeEquipo('eq1', { fecha: '2026-10-12', nota: 'A', costo: 10.25, registroId: 'mant_A' }),
      registrarMantenimientoDeEquipo('eq1', { fecha: '2026-10-12', nota: 'B', costo: 20.5, registroId: 'mant_B' }),
    ]);
    expect(ra.success && rb.success).toBe(true);
    expect(hist().map((h: any) => h.id).sort()).toEqual(['mant_A', 'mant_B']);
    expect(hist().every((h: any) => h.gastoPendiente === false)).toBe(true);
    expect(gastos.get(`mantenimiento:eq1:mant_A`).monto).toBe(10.25);
    expect(gastos.get(`mantenimiento:eq1:mant_B`).monto).toBe(20.5);
    expect(gastos.size).toBe(2);
  });

  it('(d) guardar el formulario viejo del equipo no borra el mantenimiento que anoto otra persona', async () => {
    const { registrarMantenimientoDeEquipo, saveActivoFijo } = await import('@/app/actions/activos-fijos');
    const formularioViejo = copia(equipo); // la ficha se abrio antes: historial vacio
    await registrarMantenimientoDeEquipo('eq1', { fecha: '2026-10-12', nota: 'Otro lo anoto', costo: 50, registroId: 'mant_otro' });
    const res = await saveActivoFijo({ ...formularioViejo, nombre: 'Parlante grande' });
    expect(res.success).toBe(true);
    expect(equipo.nombre).toBe('Parlante grande');
    expect(hist().map((h: any) => h.id)).toEqual(['mant_otro']);
    expect(equipo.mantenimiento.ultimoAt).toBe('2026-10-12');
    expect(equipo.mantenimiento.cadaDias).toBe(90);
  });
});

describe('Mantenimiento: la pantalla manda una identidad por trabajo', () => {
  const pagina = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/empresa/activos-fijos/[id]/editar/page.tsx'), 'utf8');

  it('un mantenimiento nuevo manda registroId estable, no undefined', () => {
    expect(pagina).toMatch(/registroId: registroIdReintento \?\? idDeLaOperacion\(\)/);
    expect(pagina).toMatch(/crypto\.randomUUID\(\)/);
  });

  it('el id se renueva solo al confirmar o al cambiar el borrador', () => {
    expect(pagina).toMatch(/borradorCambio\(\);\s*setMantenimientoNota\(''\)/);
    expect(pagina).toMatch(/setMantenimientoNota\(e\.target\.value\)/);
  });
});

/*
 * Rotura a proposito (12/10/2026), todas en rojo:
 *  - registroId sin idempotencia (siempre id nuevo): (a) falla con 2 filas.
 *  - volver a leer-copiar-escribir todo el historial: (c) pierde una fila.
 *  - saveActivoFijo con updateDataItem y el historial del formulario: (d) falla.
 */
