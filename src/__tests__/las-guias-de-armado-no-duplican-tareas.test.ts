/**
 * Orden 71 — Las guías de armado: si el paso 2 falla, no se duplica al reintentar
 *
 * Se probó rompiéndola a propósito:
 * - Al devolver tareasGeneradas: 0 cuando fallaba el paso 2, la prueba falló en rojo.
 * - Al no incluir documentos y compras en el guardado de la fiesta, la prueba falló en rojo.
 * Con los cambios aplicados, pasa a verde.
 */

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';

const mockGetFiestaById = jest.fn();
const mockSaveFiesta = jest.fn();
const mockReadData = jest.fn();
const mockWriteData = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'admin' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { email: 'admin@akproducciones.uy', role: 'admin' },
  }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
  saveFiesta: (...args: any[]) => mockSaveFiesta(...args),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

import { applyPlaybookToFiesta } from '@/app/actions/playbooks';
import type { Playbook } from '@/types/playbook';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Orden 71: Las guías de armado no duplican tareas y hacen lo que prometen', () => {
  const mockPlaybook: Playbook = {
    id: 'pb_cumple_15',
    nombre: 'Guía Quinceañera Completa',
    tipoEvento: 'Cumpleaños',
    descripcion: 'Paso a paso para 15 años',
    tareas: [
      { titulo: 'Coordinar vals', diasAntesEvento: -15, prioridad: 'Alta' },
      { titulo: 'Prueba de sonido en salón', diasAntesEvento: -1, prioridad: 'Alta' },
    ],
    documentos: [
      { nombre: 'Contrato de salón firmado', tipo: 'contrato', obligatorio: true },
      { nombre: 'Seguro de responsabilidad civil', tipo: 'seguro', obligatorio: false },
    ],
    compras: [
      { nombre: 'Pilas AA para micrófonos', categoria: 'Técnica', prioridad: 'Alta' },
      { nombre: 'Cinta gaffer negra', categoria: 'Técnica', prioridad: 'Media' },
      { nombre: 'Bengalas de humo frío', categoria: 'Animación', prioridad: 'Alta' },
    ],
    etapas: [],
    timingsRecomendados: {},
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    esPlantillaDefault: true,
  };

  const mockFiesta: FiestaEnPlanificacion = {
    id: 'fiesta_test_pb',
    configuracion: {
      nombreEvento: '15 de Sofía',
      fechaEvento: '2026-10-15',
    } as any,
    tareas: [],
    documentosRequeridos: [],
    comprasSugeridas: [],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadData.mockImplementation((file: string, fallback: any) => {
      if (file === 'playbooks.json') return Promise.resolve([mockPlaybook]);
      if (file === 'playbook-aplicaciones.json') return Promise.resolve([]);
      return Promise.resolve(fallback);
    });
    mockGetFiestaById.mockResolvedValue({ ...mockFiesta, tareas: [], documentosRequeridos: [], comprasSugeridas: [] });
    mockSaveFiesta.mockResolvedValue({ success: true });
    mockWriteData.mockResolvedValue(true);
  });

  it('1. Si el paso 2 (historial) falla, reporta la verdad: tareas creadas y historialNoAnotado: true', async () => {
    // Paso 1 (saveFiesta) tiene éxito, pero paso 2 (writeData del historial) falla
    mockWriteData.mockRejectedValueOnce(new Error('Fallo de escritura en historial'));

    const res = await applyPlaybookToFiesta('pb_cumple_15', 'fiesta_test_pb');

    expect(res.success).toBe(true);
    // Debe reportar el número real de tareas, documentos y compras, no cero
    expect(res.tareasGeneradas).toBe(2);
    expect(res.documentosGenerados).toBe(2);
    expect(res.comprasGeneradas).toBe(3);
    expect(res.historialNoAnotado).toBe(true);
    expect(res.errorHistorial).toContain('Fallo de escritura en historial');

    // Comprobamos que el guardado de la fiesta SÍ se realizó
    expect(mockSaveFiesta).toHaveBeenCalledTimes(1);
  });

  it('2. Con guardado normal sin errores, aplica una vez y genera tareas, documentos y compras', async () => {
    const res = await applyPlaybookToFiesta('pb_cumple_15', 'fiesta_test_pb');

    expect(res.success).toBe(true);
    expect(res.tareasGeneradas).toBe(2);
    expect(res.documentosGenerados).toBe(2);
    expect(res.comprasGeneradas).toBe(3);
    expect(res.historialNoAnotado).toBeUndefined();

    // Verificamos lo guardado en la fiesta
    expect(mockSaveFiesta).toHaveBeenCalledTimes(1);
    const fiestaGuardada: FiestaEnPlanificacion = mockSaveFiesta.mock.calls[0][0];

    expect(fiestaGuardada.tareas).toHaveLength(2);
    expect(fiestaGuardada.tareas![0].texto).toBe('Coordinar vals');

    expect(fiestaGuardada.documentosRequeridos).toHaveLength(2);
    expect(fiestaGuardada.documentosRequeridos![0].nombre).toBe('Contrato de salón firmado');
    expect(fiestaGuardada.documentosRequeridos![0].origen).toBe('guia');
    expect(fiestaGuardada.documentosRequeridos![0].playbookId).toBe('pb_cumple_15');

    expect(fiestaGuardada.comprasSugeridas).toHaveLength(3);
    expect(fiestaGuardada.comprasSugeridas![0].nombre).toBe('Pilas AA para micrófonos');
    expect(fiestaGuardada.comprasSugeridas![0].origen).toBe('guia');
    expect(fiestaGuardada.comprasSugeridas![0].playbookId).toBe('pb_cumple_15');

    // Verificamos que se guardó en el archivo de aplicaciones
    expect(mockWriteData).toHaveBeenCalledWith('playbook-aplicaciones.json', expect.any(Array));
  });

  it('3. Si el paso 1 (guardar fiesta) falla, no crea nada y devuelve error sin intentar el historial', async () => {
    mockSaveFiesta.mockResolvedValueOnce({ success: false, error: 'Error al persistir fiesta en disco' });

    const res = await applyPlaybookToFiesta('pb_cumple_15', 'fiesta_test_pb');

    expect(res.success).toBe(false);
    expect(res.tareasGeneradas).toBe(0);
    expect(res.documentosGenerados).toBe(0);
    expect(res.comprasGeneradas).toBe(0);
    expect(res.error).toBe('Error al persistir fiesta en disco');
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});
