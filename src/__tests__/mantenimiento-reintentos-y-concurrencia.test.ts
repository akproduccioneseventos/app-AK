/** @jest-environment node */

type Activo = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  tipoItem?: string;
  valorUnitarioEstimado?: number;
  cantidadDisponible?: number;
  mantenimiento?: {
    ultimoAt?: string;
    historial?: Array<{
      id: string;
      fecha: string;
      nota: string;
      costo?: number;
      gastoPendiente?: boolean;
    }>;
  };
};

const copia = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
const activos = new Map<string, Activo>();
const gastos = new Map<string, Record<string, unknown>>();
const colasMutacion = new Map<string, Promise<void>>();
let fallaParcialGasto = false;

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia([...activos.values()])),
  createDataItem: jest.fn(async (_file: string, _collection: string, id: string, item: Activo) => {
    if (activos.has(id)) throw new Error('duplicate id');
    activos.set(id, copia(item));
    return copia(item);
  }),
  deleteDataItem: jest.fn(async (_file: string, _collection: string, id: string) => activos.delete(id)),
  mutateDataItem: jest.fn(async (_file: string, _collection: string, id: string, callback: (actual: Activo) => Activo) => {
    const previo = colasMutacion.get(id) || Promise.resolve();
    let liberar!: () => void;
    const turno = new Promise<void>((resolve) => { liberar = resolve; });
    colasMutacion.set(id, previo.then(() => turno));
    await previo;
    try {
      const actual = activos.get(id);
      if (!actual) return null;
      const actualizado = callback(copia(actual));
      activos.set(id, copia(actualizado));
      return copia(actualizado);
    } finally {
      liberar();
    }
  }),
}));

jest.mock('@/app/actions/gastos', () => ({
  saveGastoGeneral: jest.fn(async (gasto: Record<string, unknown>) => {
    const key = String(gasto.idempotencyKey);
    const existente = gastos.get(key);
    if (existente) return { success: true, gasto: copia(existente) };
    if (fallaParcialGasto) {
      fallaParcialGasto = false;
      return { success: false, error: 'fallo parcial simulado' };
    }
    const guardado = { ...copia(gasto), id: `gasto-${gastos.size + 1}` };
    gastos.set(key, guardado);
    return { success: true, gasto: copia(guardado) };
  }),
}));

import { registrarMantenimientoDeEquipo, saveActivoFijo } from '@/app/actions/activos-fijos';
import { saveGastoGeneral } from '@/app/actions/gastos';

const activoInicial = (id = 'equipo-1'): Activo => ({
  id,
  nombre: `Equipo ${id}`,
  categoria: 'Sonido',
  unidad: 'unidad',
  tipoItem: 'Activo Fijo',
  valorUnitarioEstimado: 100,
});

const datosMantenimiento = (registroId: string, cambios: Partial<{ fecha: string; nota: string; costo: number }> = {}) => ({
  registroId,
  fecha: cambios.fecha ?? '2026-10-10',
  nota: cambios.nota ?? 'Revisión técnica',
  costo: cambios.costo ?? 125,
});

const historialDe = (id: string) => activos.get(id)?.mantenimiento?.historial ?? [];

describe('reintentos y concurrencia de mantenimiento de activos fijos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activos.clear();
    gastos.clear();
    colasMutacion.clear();
    fallaParcialGasto = false;
    activos.set('equipo-1', copia(activoInicial()));
    activos.set('equipo-2', copia(activoInicial('equipo-2')));
  });

  it('repetir el mismo registro después del éxito deja un historial y un gasto', async () => {
    const datos = datosMantenimiento('mant-repetido');
    expect((await registrarMantenimientoDeEquipo('equipo-1', datos)).success).toBe(true);
    expect((await registrarMantenimientoDeEquipo('equipo-1', datos)).success).toBe(true);

    expect(historialDe('equipo-1')).toHaveLength(1);
    expect(gastos.size).toBe(1);
    expect(saveGastoGeneral).toHaveBeenCalledTimes(1);
  });

  it('permite dos mantenimientos legítimos con la misma nota e IDs distintos', async () => {
    await registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-uno'));
    await registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-dos'));

    expect(historialDe('equipo-1').map((registro) => registro.id).sort()).toEqual(['mant-dos', 'mant-uno']);
    expect(gastos.size).toBe(2);
  });

  it('conserva simultáneamente dos trabajos sobre el mismo equipo', async () => {
    const [a, b] = await Promise.all([
      registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-A')),
      registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-B')),
    ]);

    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(historialDe('equipo-1').map((registro) => registro.id).sort()).toEqual(['mant-A', 'mant-B']);
    expect(gastos.size).toBe(2);
  });

  it('deja el gasto pendiente tras un fallo y el reintento con el mismo ID lo cierra sin duplicar historial', async () => {
    fallaParcialGasto = true;
    const datos = datosMantenimiento('mant-reintento');

    const primerIntento = await registrarMantenimientoDeEquipo('equipo-1', datos);
    expect(primerIntento).toMatchObject({ success: false, gastoPendiente: true });
    expect(historialDe('equipo-1')).toMatchObject([{ id: 'mant-reintento', gastoPendiente: true }]);

    const reintento = await registrarMantenimientoDeEquipo('equipo-1', datos);
    expect(reintento.success).toBe(true);
    expect(historialDe('equipo-1')).toMatchObject([{ id: 'mant-reintento', gastoPendiente: false }]);
    expect(historialDe('equipo-1')).toHaveLength(1);
    expect(gastos.size).toBe(1);
    expect(saveGastoGeneral).toHaveBeenCalledTimes(2);
  });

  it('saveActivoFijo con snapshot viejo preserva un mantenimiento agregado entretanto', async () => {
    const snapshotViejo = copia(activos.get('equipo-1')!);
    const guardado = await registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-interviniente'));
    expect(guardado.success).toBe(true);

    const resultado = await saveActivoFijo({ ...snapshotViejo, nombre: 'Equipo renombrado' });

    expect(resultado.success).toBe(true);
    expect(activos.get('equipo-1')?.nombre).toBe('Equipo renombrado');
    expect(historialDe('equipo-1').map((registro) => registro.id)).toEqual(['mant-interviniente']);
    expect(gastos.size).toBe(1);
  });

  it('rechaza el mismo ID con otro payload sin alterar registro ni gasto', async () => {
    await registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-conflicto'));
    const historialAntes = copia(historialDe('equipo-1'));
    const gastosAntes = copia([...gastos.entries()]);

    await expect(registrarMantenimientoDeEquipo('equipo-1', datosMantenimiento('mant-conflicto', { nota: 'Otro trabajo' }))).rejects.toThrow(/otros datos/i);
    expect(historialDe('equipo-1')).toEqual(historialAntes);
    expect([...gastos.entries()]).toEqual(gastosAntes);
    expect(saveGastoGeneral).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['fecha imposible', { fecha: '2026-02-30' }],
    ['fecha con formato inválido', { fecha: '10/10/2026' }],
    ['costo negativo', { costo: -1 }],
    ['costo no finito', { costo: Number.POSITIVE_INFINITY }],
  ])('rechaza %s sin modificar historial ni crear gasto', async (_caso, cambios) => {
    const resultado = await registrarMantenimientoDeEquipo('equipo-1', {
      ...datosMantenimiento('mant-invalido'),
      ...cambios,
    });

    expect(resultado.success).toBe(false);
    expect(resultado.sinCambios).toBe(true);
    expect(historialDe('equipo-1')).toEqual([]);
    expect(gastos.size).toBe(0);
    expect(saveGastoGeneral).not.toHaveBeenCalled();
  });
});
