jest.mock('@/lib/data-service', () => ({
  createDataItem: jest.fn(),
  readData: jest.fn(),
  updateDataItem: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
}));

import {
  createProveedorAcceso,
  toggleTareaProveedor,
  updateProveedorEstado,
} from '@/app/actions/provider-portal';
import { requireAppSession } from '@/lib/auth/require-session';
import { createDataItem, readData, updateDataItem } from '@/lib/data-service';
import type { ProveedorPortalAccess } from '@/types/provider-portal';

const provider: ProveedorPortalAccess = {
  id: 'prov-existing',
  fiestaId: 'fiesta-1',
  token: 'private-token',
  nombreProveedor: 'Sonido Uno',
  tipoProveedor: 'Sonido',
  telefono: '099000000',
  horaLlegadaEstimada: '18:30',
  estadoActual: 'Pendiente',
  tareas: [{ id: 'task-1', texto: 'Prueba de sonido', completada: false }],
  createdAt: '2026-07-29T12:00:00.000Z',
  activo: true,
};

describe('provider portal actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readData as jest.Mock).mockResolvedValue([provider]);
    (updateDataItem as jest.Mock).mockResolvedValue(true);
  });

  it('creates each access as an isolated Firestore document behind the app session', async () => {
    (createDataItem as jest.Mock).mockResolvedValue(undefined);

    const result = await createProveedorAcceso({
      fiestaId: ' fiesta-1 ',
      nombreProveedor: ' Sonido Uno ',
      tipoProveedor: 'Sonido',
      telefono: '099000000',
      horaLlegadaEstimada: '18:30',
      estadoActual: 'Pendiente',
      tareas: [],
      activo: true,
    });

    expect(requireAppSession).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      success: true,
      data: {
        fiestaId: 'fiesta-1',
        nombreProveedor: 'Sonido Uno',
      },
    });
    expect(createDataItem).toHaveBeenCalledWith(
      'proveedor-portal.json',
      'proveedor_portal',
      expect.stringMatching(/^prov-/),
      expect.objectContaining({ token: expect.any(String) }),
    );
  });

  it('updates only the provider document authorized by its active token', async () => {
    const result = await updateProveedorEstado('private-token', 'Confirmado');

    expect(result).toMatchObject({
      success: true,
      data: { id: 'prov-existing', estadoActual: 'Confirmado' },
    });
    expect(updateDataItem).toHaveBeenCalledWith(
      'proveedor-portal.json',
      'proveedor_portal',
      'prov-existing',
      expect.objectContaining({ estadoActual: 'Confirmado' }),
    );
  });

  it('rejects inactive tokens and unknown tasks without writing', async () => {
    (readData as jest.Mock).mockResolvedValueOnce([{ ...provider, activo: false }]);
    await expect(updateProveedorEstado('private-token', 'Confirmado')).resolves.toMatchObject({
      success: false,
    });

    (readData as jest.Mock).mockResolvedValueOnce([provider]);
    await expect(toggleTareaProveedor('private-token', 'missing-task')).resolves.toEqual({
      success: false,
      error: 'La tarea indicada no existe.',
    });
    expect(updateDataItem).not.toHaveBeenCalled();
  });
});
