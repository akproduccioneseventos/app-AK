/**
 * MATAFUEGO — Con dos servidores, un comentario de un incidente no se pierde.
 *
 * Lo midio Codex el 25 de septiembre de 2026 (INC01): con el turno en memoria, un comentario y
 * un "resuelto" que caian en dos servidores terminaban con el incidente resuelto y CERO
 * comentarios, y las dos pantallas decian que se guardo. Ahora, con base, se cambia ese solo
 * incidente leido adentro de la operacion.
 *
 * Los dos servidores se simulan cargando el modulo dos veces (`jest.isolateModules`), cada uno
 * con su turno. La base de mentira devuelve COPIAS y tarda (error 11 de CLAUDE.md).
 *
 * Se probo rompiendolo: con el codigo de antes (lista entera), la primera y la segunda se
 * ponen en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 20));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    await esperar();
    return almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await esperar();
    almacen[archivo] = copia(datos);
  }),
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    await esperar();
    const lista = almacen[archivo] || [];
    if (lista.some((x: any) => x.id === id)) throw new Error('ya existe');
    almacen[archivo] = [...lista, copia(item)];
  }),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (x: any) => any) => {
    await esperar();
    const lista = almacen[archivo] || [];
    const i = lista.findIndex((x: any) => x.id === id);
    if (i === -1) return null;
    const nuevo = cambiar(copia(lista[i]));
    if (!nuevo) return null;
    lista[i] = copia(nuevo);
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

function servidor(): typeof import('@/app/actions/incidents') {
  let m: any;
  jest.isolateModules(() => { m = require('@/app/actions/incidents'); });
  return m;
}

const INCIDENTE = { id: 'inc_1', fiestaId: 'f1', titulo: 'Se corto la luz', estado: 'Abierto', registradoEn: '2026-09-25T00:00:00.000Z', actualizaciones: [] };

describe('Los incidentes no pierden comentarios con dos servidores', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    almacen['incidentes.json'] = [copia(INCIDENTE)];
  });
  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  it('un comentario y un "resuelto" a la vez: quedan los dos', async () => {
    const [a, b] = await Promise.all([
      servidor().addActualizacionIncidente('inc_1', 'Llamamos al electricista', 'Ana'),
      servidor().resolverIncidente('inc_1', 'Tener generador'),
    ]);
    expect(a.success && b.success).toBe(true);
    const inc = almacen['incidentes.json'][0];
    expect(inc.estado).toBe('Resuelto');
    expect(inc.actualizaciones).toHaveLength(1);
  });

  it('dos comentarios a la vez en dos servidores: quedan los dos, con identificadores distintos', async () => {
    await Promise.all([
      servidor().addActualizacionIncidente('inc_1', 'Uno', 'Ana'),
      servidor().addActualizacionIncidente('inc_1', 'Dos', 'Beto'),
    ]);
    const acts = almacen['incidentes.json'][0].actualizaciones;
    expect(acts).toHaveLength(2);
    expect(new Set(acts.map((x: any) => x.id)).size).toBe(2);
  });

  it('dos incidentes creados a la vez quedan los dos', async () => {
    const datos = { fiestaId: 'f1', titulo: 'Nuevo', estado: 'Abierto' } as any;
    await Promise.all([servidor().createIncidente(datos), servidor().createIncidente(datos)]);
    expect(almacen['incidentes.json']).toHaveLength(3);
  });

  it('un incidente que no existe no dice que se guardo', async () => {
    const r = await servidor().addActualizacionIncidente('no-existe', 'x', 'y');
    expect(r.success).toBe(false);
  });

  it('si la base falla, no dice que se guardo', async () => {
    const ds = jest.requireMock('@/lib/data-service');
    (ds.mutateDataItem as jest.Mock).mockRejectedValueOnce(new Error('base caida'));
    const r = await servidor().resolverIncidente('inc_1');
    expect(r.success).toBe(false);
  });

  it('sin sesion del equipo, no toca nada', async () => {
    const rs = jest.requireMock('@/lib/auth/require-session');
    (rs.requireAppSession as jest.Mock).mockRejectedValueOnce(new Error('Sesion no autorizada.'));
    await expect(servidor().resolverIncidente('inc_1')).rejects.toThrow();
    expect(almacen['incidentes.json'][0].estado).toBe('Abierto');
  });
});
