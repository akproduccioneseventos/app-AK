let readError: Error | null = null;
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: { collection: () => ({ get: async () => { if (readError) throw readError; return { empty: true, docs: [] }; } }) } }));
jest.mock('@/lib/generic-json-store', () => ({ readGenericJsonFile: jest.fn(async () => null) }));
jest.mock('fs/promises', () => ({ __esModule: true, readFile: jest.fn(async () => '[{"id":"viejo"}]') }));
jest.mock('@/lib/logger', () => ({ shouldSkipFirestoreDuringBuild: () => false, isBuildTime: () => false, isDefaultCredentialError: () => false, compactError: (error: unknown) => error, error: jest.fn(), warn: jest.fn(), info: jest.fn() }));
import { readDataConDetalle } from '@/lib/data-service';
import { readGenericJsonFile } from '@/lib/generic-json-store';
describe('detalle con lectura Firestore real y respaldo local viejo', () => {
  beforeEach(() => { readError = null; (readGenericJsonFile as jest.Mock).mockResolvedValue(null); });
  it('un rechazo real conserva datos anteriores para mostrar pero marca la copia como fallida', async () => {
    readError = new Error('offline');
    const result = await readDataConDetalle('proveedores.json', []);
    expect(result.huboFalla).toBe(true);
    expect(result.valor).toEqual([{ id: 'viejo' }]);
  });
  it('una coleccion vacia real no resucita el ultimo proveedor del respaldo local', async () => {
    expect(await readDataConDetalle('proveedores.json', [])).toEqual({ valor: [], huboFalla: false });
  });
  it('una copia generica existente tampoco oculta el rechazo de la coleccion principal', async () => {
    readError = new Error('offline');
    (readGenericJsonFile as jest.Mock).mockResolvedValue([{ id: 'copia' }]);
    expect(await readDataConDetalle('proveedores.json', [])).toEqual({ valor: [{ id: 'copia' }], huboFalla: true });
  });
});
