/** @jest-environment node */

// Base de mentira: cada lectura devuelve una COPIA, como la de verdad (error 11 de CLAUDE.md).
let guardado: Record<string, unknown> | null = null;
jest.mock('@/lib/data-service', () => ({
  createDataItem: jest.fn(),
  readData: jest.fn(),
  mutateDataItem: jest.fn(async (_f: string, _c: string, _id: string, cambiar: (a: unknown) => unknown) => {
    if (!guardado) return null;
    const nuevo = cambiar(structuredClone(guardado));
    if (!nuevo) return null;
    guardado = structuredClone(nuevo) as Record<string, unknown>;
    return nuevo;
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
  requirePermisoAlguno: jest.fn(),
}));

import {
  addNotaProveedor,
  confirmarLlegada,
  createProveedorAcceso,
  toggleTareaProveedor,
  updateProveedorEstado,
} from '@/app/actions/provider-portal';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';
import { createDataItem, mutateDataItem, readData } from '@/lib/data-service';
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
    guardado = structuredClone(provider) as unknown as Record<string, unknown>;
    (readData as jest.Mock).mockImplementation(async () => [structuredClone(guardado)]);
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

    expect(requirePermisoAlguno).toHaveBeenCalledWith('organizacion', 'contabilidad');
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
    expect(mutateDataItem).toHaveBeenCalledWith('proveedor-portal.json', 'proveedor_portal', 'prov-existing', expect.any(Function));
    expect(guardado).toMatchObject({ estadoActual: 'Confirmado' });
  });

  it('rejects inactive tokens and unknown tasks without writing', async () => {
    (readData as jest.Mock).mockResolvedValueOnce([{ ...provider, activo: false }]);
    await expect(updateProveedorEstado('private-token', 'Confirmado')).resolves.toMatchObject({
      success: false,
    });

    await expect(toggleTareaProveedor('private-token', 'missing-task')).resolves.toEqual({
      success: false,
      error: 'La tarea indicada no existe.',
    });
    expect(guardado).toMatchObject({ tareas: [{ id: 'task-1', completada: false }] });
  });
});

/**
 * Orden 204 (Codex 163/168): las acciones leían la ficha antes de la transacción y guardaban la ficha
 * entera. Dos toques a la vez perdían uno, y un acceso desactivado en el medio volvía a quedar activo.
 */
describe('el portal del proveedor no pisa cambios ni reactiva un acceso', () => {
  const dosTareas = { ...provider, tareas: [
    { id: 'a', texto: 'Armar', completada: false },
    { id: 'b', texto: 'Probar', completada: false },
  ] };

  beforeEach(() => {
    jest.clearAllMocks();
    guardado = structuredClone(dosTareas) as unknown as Record<string, unknown>;
    // Las dos lecturas de afuera ven la ficha vieja, como cuando llegan dos toques juntos.
    const vieja = structuredClone(dosTareas);
    (readData as jest.Mock).mockImplementation(async () => [structuredClone(vieja)]);
  });

  it('dos tareas marcadas a la vez quedan las dos', async () => {
    const [r1, r2] = await Promise.all([
      toggleTareaProveedor('private-token', 'a'),
      toggleTareaProveedor('private-token', 'b'),
    ]);
    expect(r1.success && r2.success).toBe(true);
    expect((guardado as any).tareas.map((t: { completada: boolean }) => t.completada)).toEqual([true, true]);
  });

  it('la llegada y la nota a la vez quedan las dos', async () => {
    await Promise.all([confirmarLlegada('private-token'), addNotaProveedor('private-token', 'Llego con el camión')]);
    expect(guardado).toMatchObject({ estadoActual: 'Llegó', notas: 'Llego con el camión' });
    expect((guardado as any).llegadaConfirmadaEn).toEqual(expect.any(String));
  });

  it('un acceso desactivado o con token nuevo en el medio no se reactiva ni dice que salió', async () => {
    (guardado as any).activo = false;
    await expect(toggleTareaProveedor('private-token', 'a')).resolves.toMatchObject({ success: false });
    expect(guardado).toMatchObject({ activo: false });

    (guardado as any).activo = true;
    (guardado as any).token = 'token-nuevo';
    await expect(addNotaProveedor('private-token', 'hola')).resolves.toMatchObject({ success: false });
    expect(guardado).toMatchObject({ token: 'token-nuevo' });
    expect((guardado as any).notas).toBeUndefined();
  });
});
