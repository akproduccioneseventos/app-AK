/**
 * Codex, 7 de octubre de 2026 (PR 1263), y el barrido de la misma forma: la base REPITE una
 * transaccion si otro servidor guardo en el medio. `updateDataItem` y `deleteDataItem` marcaban
 * "hecho" en el intento descartado y no lo desmarcaban: si otro borraba el registro entre los
 * dos intentos, actualizar devolvia `true` sin haber guardado nada, y la pantalla decia
 * "guardado" (cobros, cuotas y presupuestos usan estas dos funciones).
 *
 * Usa las funciones reales con una base de mentira que corre la transaccion dos veces.
 */

import os from 'os';
import path from 'path';
import { mkdtempSync } from 'fs';

let existe = true;
let intentos = 0;
let escrituras = 0;
let entreIntentos: (() => void) | undefined;

const ref = { id: 'cuota-1' };
const baseDeMentira = {
  collection: () => ({
    doc: () => ref,
    get: async () => ({ docs: [] }),
  }),
  runTransaction: async (fn: (t: any) => Promise<unknown>) => {
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      if (vuelta === 1) entreIntentos?.();
      intentos++;
      let pendiente = 0;
      await fn({
        get: async () => ({ exists: existe, data: () => (existe ? { id: 'cuota-1' } : undefined) }),
        set: () => { pendiente++; },
        delete: () => { pendiente++; },
      });
      if (vuelta === 1) escrituras += pendiente; // el primer intento la base lo descarta
    }
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: baseDeMentira }));

import { updateDataItem, deleteDataItem } from '@/lib/data-service';

describe('una transaccion repetida no dice que guardo lo que no guardo', () => {
  const localOriginal = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeAll(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    jest.spyOn(process, 'cwd').mockReturnValue(mkdtempSync(path.join(os.tmpdir(), 'tx-replay-')));
  });

  afterAll(() => {
    if (localOriginal !== undefined) process.env.AK_USE_LOCAL_JSON_ONLY = localOriginal;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    existe = true;
    intentos = 0;
    escrituras = 0;
    entreIntentos = undefined;
  });

  it('actualizar un registro que otro borro entre intentos devuelve false', async () => {
    entreIntentos = () => { existe = false; };
    const ok = await updateDataItem('presupuestos.json', 'presupuestos', 'cuota-1', { id: 'cuota-1', monto: 100 }, { skipAutoBackup: true });
    expect(intentos).toBe(2);
    expect(escrituras).toBe(0);
    expect(ok).toBe(false);
  });

  it('actualizar un registro que sigue estando devuelve true y guarda una vez', async () => {
    const ok = await updateDataItem('presupuestos.json', 'presupuestos', 'cuota-1', { id: 'cuota-1', monto: 100 }, { skipAutoBackup: true });
    expect(intentos).toBe(2);
    expect(escrituras).toBe(1);
    expect(ok).toBe(true);
  });

  it('borrar un registro que otro ya borro entre intentos devuelve false', async () => {
    entreIntentos = () => { existe = false; };
    const ok = await deleteDataItem('presupuestos.json', 'presupuestos', 'cuota-1', { skipAutoBackup: true });
    expect(escrituras).toBe(0);
    expect(ok).toBe(false);
  });
});
