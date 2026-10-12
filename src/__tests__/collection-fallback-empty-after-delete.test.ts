/**
 * Orden 156 (1): borrar el ULTIMO documento de una coleccion tiene que vaciar tambien la copia
 * local; si no, al recargar el proveedor borrado reaparece. Pero una lectura caida NUNCA vacia
 * la copia (readFromFirestore devuelve null tanto para "vacia" como para "fallo").
 */
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: (...a: unknown[]) => mockWriteFile(...a),
}));

const mockLimitGet = jest.fn();
const mockTransactionGet = jest.fn().mockResolvedValue({ exists: true });
const mockDocRef = {};
const mockCollection = jest.fn(() => ({ doc: () => mockDocRef, limit: () => ({ get: mockLimitGet }) }));
const mockRunTransaction = jest.fn(async (cb: (t: any) => Promise<void>) => {
  await cb({ get: mockTransactionGet, delete: jest.fn(), set: jest.fn() });
});
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: { collection: mockCollection, runTransaction: mockRunTransaction } }));

const mockReadFromFirestore = jest.fn();
jest.mock('@/lib/firebase-sync', () => ({
  syncToFirestore: jest.fn(),
  readFromFirestore: (...a: unknown[]) => mockReadFromFirestore(...a),
}));
jest.mock('@/lib/generic-json-store', () => ({ readGenericJsonFile: jest.fn().mockResolvedValue(null), syncGenericJsonFile: jest.fn() }));
jest.mock('@/lib/backup/backup-registry', () => ({ isSafeTopLevelJsonFile: jest.fn().mockReturnValue(true) }));
jest.mock('@/app/actions/backup', () => ({ triggerAutoBackup: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/backup/internal-token', () => ({ AUTO_BACKUP_INTERNAL_TOKEN: 'test-token' }));
jest.mock('next/server', () => ({ after: jest.fn() }));

import { deleteDataItem } from '@/lib/data-service';

const escrituras = () => mockWriteFile.mock.calls.map(([ruta, contenido]) => ({ ruta: String(ruta), contenido: String(contenido) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockTransactionGet.mockResolvedValue({ exists: true });
});

describe('borrar el ultimo documento de una coleccion', () => {
  test('la coleccion quedo vacia de verdad: la copia local queda en []', async () => {
    mockReadFromFirestore.mockResolvedValue(null);
    mockLimitGet.mockResolvedValue({ empty: true });
    await expect(deleteDataItem('proveedores.json', 'proveedores', 'prov_1')).resolves.toBe(true);
    const ws = escrituras().filter((w) => w.ruta.includes('proveedores.json'));
    expect(ws.length).toBeGreaterThan(0);
    expect(ws.every((w) => JSON.parse(w.contenido).length === 0)).toBe(true);
  });

  test('la lectura de comprobacion falla: la copia NO se toca', async () => {
    mockReadFromFirestore.mockResolvedValue(null);
    mockLimitGet.mockRejectedValue(new Error('base caida'));
    await expect(deleteDataItem('proveedores.json', 'proveedores', 'prov_1')).resolves.toBe(true);
    expect(escrituras().filter((w) => w.ruta.includes('proveedores.json'))).toHaveLength(0);
  });

  test('quedan documentos (otro creo uno en el medio) y la lectura general fallo: la copia NO se vacia', async () => {
    mockReadFromFirestore.mockResolvedValue(null);
    mockLimitGet.mockResolvedValue({ empty: false });
    await deleteDataItem('proveedores.json', 'proveedores', 'prov_1');
    expect(escrituras().filter((w) => w.ruta.includes('proveedores.json'))).toHaveLength(0);
  });

  test('coleccion que sigue con elementos: la copia local se refresca con lo que queda', async () => {
    mockReadFromFirestore.mockResolvedValue([{ id: 'prov_2', nombre: 'Otro' }]);
    await deleteDataItem('proveedores.json', 'proveedores', 'prov_1');
    const ws = escrituras().filter((w) => w.ruta.includes('proveedores.json'));
    expect(ws.length).toBeGreaterThan(0);
    expect(JSON.parse(ws[0].contenido)).toEqual([{ id: 'prov_2', nombre: 'Otro' }]);
    expect(mockLimitGet).not.toHaveBeenCalled();
  });

  test('reintento sobre algo ya borrado: no escribe nada', async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });
    await expect(deleteDataItem('proveedores.json', 'proveedores', 'prov_1')).resolves.toBe(false);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
