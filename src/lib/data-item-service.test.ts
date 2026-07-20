const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockTransactionGet = jest.fn().mockResolvedValue({ exists: true });
const mockTransactionSet = jest.fn();
const mockTransactionDelete = jest.fn();
const mockDocumentRef = { create: mockCreate };
const mockRunTransaction = jest.fn(async (callback: (transaction: any) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    set: mockTransactionSet,
    delete: mockTransactionDelete,
  });
});
const mockDoc = jest.fn(() => mockDocumentRef);
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: { collection: mockCollection, runTransaction: mockRunTransaction },
}));
jest.mock('@/lib/firebase-sync', () => ({
  syncToFirestore: jest.fn(),
  readFromFirestore: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/lib/generic-json-store', () => ({
  readGenericJsonFile: jest.fn().mockResolvedValue(null),
  syncGenericJsonFile: jest.fn(),
}));
jest.mock('@/lib/backup/backup-registry', () => ({
  isSafeTopLevelJsonFile: jest.fn().mockReturnValue(true),
}));
jest.mock('@/app/actions/backup', () => ({
  triggerAutoBackup: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/backup/internal-token', () => ({
  AUTO_BACKUP_INTERNAL_TOKEN: 'test-token',
}));
jest.mock('next/server', () => ({
  after: jest.fn(),
}));

import { createDataItem, deleteDataItem, updateDataItem } from './data-service';

describe('data item service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionGet.mockResolvedValue({ exists: true });
  });

  it('creates one document without replacing its collection', async () => {
    await createDataItem('proveedores.json', 'proveedores', 'prov_1', { id: 'prov_1', nombre: 'Proveedor' });

    expect(mockCollection).toHaveBeenCalledWith('proveedores');
    expect(mockDoc).toHaveBeenCalledWith('prov_1');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ id: 'prov_1', nombre: 'Proveedor' }));
  });

  it('updates and deletes existing documents inside transactions', async () => {
    await expect(updateDataItem('empleados.json', 'empleados', 'emp_1', { id: 'emp_1', nombre: 'Ana' }))
      .resolves.toBe(true);
    await expect(deleteDataItem('empleados.json', 'empleados', 'emp_1'))
      .resolves.toBe(true);

    expect(mockRunTransaction).toHaveBeenCalledTimes(2);
    expect(mockTransactionSet).toHaveBeenCalledWith(mockDocumentRef, expect.objectContaining({ id: 'emp_1' }));
    expect(mockTransactionDelete).toHaveBeenCalledWith(mockDocumentRef);
  });

  it('does not recreate a document that disappeared during an update', async () => {
    mockTransactionGet.mockResolvedValueOnce({ exists: false });

    await expect(updateDataItem('activos-fijos.json', 'activos_fijos', 'activo_1', { id: 'activo_1' }))
      .resolves.toBe(false);
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });
});
