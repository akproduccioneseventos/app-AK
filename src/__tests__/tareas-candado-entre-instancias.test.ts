/**
 * El candado de las tareas automáticas entre servidores (Codex, auditoría 66, AUTO01).
 *
 * Cada servidor es una copia del módulo con su propia memoria; lo único que comparten es la base.
 * Antes dos servidores leían "libre" a la vez y corrían los dos, y al vencer el dueño viejo
 * liberaba el candado del nuevo. Se probó rompiéndolo: con el candado viejo fallan las dos.
 */
const base: Record<string, any> = {};
const copia = (v: any) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const datos = () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : copia(base[f]))),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = copia(v); }),
});
// La base de verdad hace la operación entera de una (una transacción): acá, una cola única que
// comparten todos los "servidores". Leer y escribir por separado no pasa por acá.
let cola: Promise<unknown> = Promise.resolve();
const transaccion = () => ({
  mutarDocumentoConTransaccion: jest.fn((f: string, vacio: any, cambiar: (a: any) => any) => {
    const paso = cola.then(async () => {
      const nuevo = await cambiar(base[f] === undefined ? copia(vacio) : copia(base[f]));
      if (nuevo === null) return null;
      base[f] = copia(nuevo);
      return nuevo;
    });
    cola = paso.catch(() => undefined);
    return paso;
  }),
});
jest.mock('@/lib/data-service', () => datos());
jest.mock('@/lib/generic-json-store', () => transaccion());

type Candado = typeof import('@/lib/automatico/control-concurrencia');
function otroServidor(): Candado {
  let m: Candado | undefined;
  jest.isolateModules(() => {
    jest.doMock('@/lib/data-service', () => datos());
    jest.doMock('@/lib/generic-json-store', () => transaccion());
    m = require('@/lib/automatico/control-concurrencia');
  });
  return m!;
}

beforeEach(() => { for (const k of Object.keys(base)) delete base[k]; jest.useRealTimers(); });

describe('Dos servidores, una sola base', () => {
  it('a la vez: lo toma uno solo', async () => {
    const a = otroServidor();
    const b = otroServidor();
    const [ra, rb] = await Promise.all([a.intentarAdquirirLock('despertador'), b.intentarAdquirirLock('visita')]);
    expect([ra, rb].filter(Boolean)).toHaveLength(1);
  });

  it('vencido: lo toma otro, y el viejo al terminar no se lo libera', async () => {
    const a = otroServidor();
    const b = otroServidor();
    const c = otroServidor();
    const viejo = await a.intentarAdquirirLock('despertador');
    expect(viejo).toBeTruthy();
    // Pasan seis minutos: el candado de A venció.
    base['automatico/tareas-lock.json'].iniciadoEn = new Date(Date.now() - 6 * 60_000).toISOString();
    const nuevo = await b.intentarAdquirirLock('visita');
    expect(nuevo).toBeTruthy();
    await a.liberarLock(viejo!);
    expect(base['automatico/tareas-lock.json'].dueno).toBe(nuevo);
    expect(await c.intentarAdquirirLock('app')).toBeNull();
  });

  it('un trabajo largo lo renueva y no vence mientras corre', async () => {
    const a = otroServidor();
    const b = otroServidor();
    const dueno = await a.intentarAdquirirLock('despertador');
    base['automatico/tareas-lock.json'].iniciadoEn = new Date(Date.now() - 4 * 60_000).toISOString();
    expect(await a.renovarLock(dueno!)).toBe(true);
    expect(await b.intentarAdquirirLock('visita')).toBeNull();
  });
});
