/** @jest-environment node */
/**
 * UN EQUIPO ASIGNADO A UNA FIESTA NO SE BORRA, AUNQUE LE CAMBIEN EL NOMBRE.
 *
 * **Lo encontro Codex el 18 de septiembre de 2026.** El control que impide borrar un equipo
 * asignado miraba `item.id` y `item.activoId`, que **no son los campos que usa la lista de
 * carga**: ahi el equipo del catalogo se guarda en `origenId`. Asi que la unica defensa que
 * quedaba en pie era comparar el NOMBRE.
 *
 * Con eso, renombrar el equipo y borrarlo funcionaba: la fiesta se quedaba sin el equipo y el
 * dia del evento no lo iba a buscar nadie.
 */

const readData = jest.fn();
const getFiestas = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => readData(...(args as [])),
  writeData: jest.fn(async () => undefined),
  deleteDataItem: jest.fn(async () => true),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: (...args: unknown[]) => getFiestas(...(args as [])),
}));

const EQUIPO = { id: 'activo_1', nombre: 'Parlante grande (renombrado)', cantidadDisponible: 4 };

function fiestaQueLoUsa() {
  return {
    id: 'fiesta_1',
    listaDeCargaOperativa: {
      categorias: [
        {
          id: 'cat_1',
          nombre: 'Sonido',
          // Asi lo guarda la pantalla de carga operativa: el equipo del catalogo va en origenId,
          // y el nombre quedo con el texto VIEJO, de antes de renombrarlo.
          items: [{ id: 'item_1', nombre: 'Parlante grande', origenId: 'activo_1', cantidad: '2' }],
        },
      ],
    },
  };
}

describe('Un equipo asignado a una fiesta no se puede borrar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readData.mockResolvedValue([EQUIPO]);
    getFiestas.mockResolvedValue([fiestaQueLoUsa()]);
  });

  it('no se borra aunque le hayan cambiado el nombre despues de asignarlo', async () => {
    const { deleteActivoFijo } = await import('@/app/actions/activos-fijos');

    const resultado = await deleteActivoFijo('activo_1');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/asignado/i);
  });

  it('un equipo que no usa ninguna fiesta si se puede borrar', async () => {
    getFiestas.mockResolvedValue([]);
    const { deleteActivoFijo } = await import('@/app/actions/activos-fijos');

    const resultado = await deleteActivoFijo('activo_1');

    expect(resultado.success).toBe(true);
  });
});
