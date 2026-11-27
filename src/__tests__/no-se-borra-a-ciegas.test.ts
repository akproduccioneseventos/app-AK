import { esLecturaFallida, marcarLecturaFallida } from '@/lib/marca-de-lectura';

describe('No se borra a ciegas si falló la lectura (Orden 374 B1 y B2)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('deleteEmpleado no borra si la lectura de fiestas futuras falla', async () => {
    const deleteDataItem = jest.fn(async () => true);
    const deleteFromStorage = jest.fn(async () => true);

    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn(async () => ({ success: true, user: { id: 'admin', perfil: 'dueno' } })),
    }));
    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => ({ user: { id: 'admin', perfil: 'dueno' } })),
      requirePermiso: jest.fn(async () => ({ ok: true })),
    }));
    jest.doMock('@/lib/data-service', () => ({
      createDataItem: jest.fn(),
      deleteDataItem,
      mutateDataItem: jest.fn(),
      readData: jest.fn(async () => [
        { id: 'emp-1', nombre: 'Lucia', role: 'Mozo', contractFileName: 'contratos/lucia.pdf' },
      ]),
      writeData: jest.fn(),
    }));
    jest.doMock('@/lib/firebase/storage', () => ({
      uploadToStorage: jest.fn(),
      deleteFromStorage,
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getAllFiestas: jest.fn(async () => {
        throw new Error('Firestore timeout');
      }),
      getFiestas: jest.fn(async () => []),
    }));

    const { deleteEmpleado } = await import('@/app/actions/empleados');
    const res = await deleteEmpleado('emp-1');

    expect(res.success).toBe(false);
    expect(res.error).toContain('No se pudo comprobar si trabaja en una fiesta');
    expect(deleteDataItem).not.toHaveBeenCalled();
    expect(deleteFromStorage).not.toHaveBeenCalled();
  });

  it('leerInsumosCrudos conserva marca de lectura fallida sin cachearla y deleteProveedor no borra', async () => {
    const deleteDataItem = jest.fn(async () => true);
    let llamada = 0;

    jest.doMock('@/lib/auth/require-session', () => ({
      requirePermisoAlguno: jest.fn(async () => ({ ok: true })),
      requirePermiso: jest.fn(async () => ({ ok: true })),
    }));
    jest.doMock('@/lib/data-service', () => ({
      createDataItem: jest.fn(),
      deleteDataItem,
      mutateDataItem: jest.fn(),
      writeData: jest.fn(),
      readData: jest.fn(async (file: string) => {
        if (file === 'insumos.json') {
          llamada += 1;
          if (llamada === 1) return marcarLecturaFallida([]);
          return [{ id: 'ins-1', nombre: 'Hielo', proveedor: 'prov-1' }];
        }
        return [{ id: 'prov-1', nombreEmpresa: 'Distribuidora Sur' }];
      }),
    }));

    const { leerInsumosCrudos, limpiarCacheInsumos } = await import('@/lib/insumos/leer-insumos');
    limpiarCacheInsumos();
    const primera = await leerInsumosCrudos();
    expect(esLecturaFallida(primera)).toBe(true);

    const { deleteProveedor } = await import('@/app/actions/proveedores');
    // Volvemos a simular falla en getInsumos:
    limpiarCacheInsumos();
    llamada = 0;
    const res = await deleteProveedor('prov-1');
    expect(res.success).toBe(false);
    expect(res.error).toContain('insumos asociados');
    expect(deleteDataItem).not.toHaveBeenCalled();
  });
});
