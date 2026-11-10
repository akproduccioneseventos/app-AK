/** @jest-environment node */
/**
 * MATAFUEGO — En el servidor publicado no hay credenciales en variables de entorno: Firebase usa las de la
 * máquina. La entrega de la orden 270 hizo que, si no veía esas variables, el almacén genérico guardara en un
 * archivo del disco en vez de la base. En producción eso habría mandado guardados de cobros, reglas y avisos a
 * un disco que se borra, distinto en cada servidor. Se probó rompiéndola: con ese cambio, esta prueba da rojo.
 */
jest.mock('server-only', () => ({}));

const runTransaction = jest.fn(async (fn: (t: any) => Promise<void>) => {
  await fn({ get: async () => ({ exists: false, data: () => undefined }), set: jest.fn() });
});
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: { runTransaction: (fn: any) => runTransaction(fn), collection: () => ({ doc: () => ({}) }) },
}));
const writeData = jest.fn();
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async (_f: string, v: any) => v), writeData: (...a: any[]) => writeData(...a) }));

import { mutateGenericJsonArray } from '@/lib/generic-json-store';

describe('Sin credenciales a la vista, igual guarda en la base', () => {
  const guardado = { ...process.env };
  beforeEach(() => {
    (process.env as any).NODE_ENV = 'production';
    for (const k of ['AK_USE_LOCAL_JSON_ONLY', 'FIRESTORE_EMULATOR_HOST', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']) delete process.env[k];
    runTransaction.mockClear();
    writeData.mockClear();
  });
  afterEach(() => { process.env = { ...guardado }; });

  it('usa la transacción de la base y no un archivo local', async () => {
    await mutateGenericJsonArray<any>('scheduled-messages.json', (l) => [...l, { id: 'x' }]);
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(writeData).not.toHaveBeenCalled();
  });
});
