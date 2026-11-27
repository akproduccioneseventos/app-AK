/** @jest-environment node */

const mocks = {
  fiestas: new Map<string, any>(),
  presupuestos: new Map<string, any>(),
  roles: [
    { id: 'rol_mozo', nombre: 'Mozo', sueldoPorEvento: 2000, porcentajeAportesPatronales: 0 },
    { id: 'rol_barman', nombre: 'Barman', sueldoPorEvento: 2000, porcentajeAportesPatronales: 0 },
    { id: 'rol_utilero', nombre: 'Utilero', sueldoPorEvento: 1800, porcentajeAportesPatronales: 0 },
  ],
};

const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', perfil: 'dueno' } })),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'u1', perfil: 'dueno' })),
  requirePermisoAlguno: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'u1', perfil: 'dueno' } })),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => undefined),
}));
jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  quienEsElEquipo: jest.fn(async () => () => true),
  usuarioDelEquipo: jest.fn(async () => true),
}));
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => false),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, def: any) => {
    if (f.startsWith('fiestas/') && f.endsWith('.json')) {
      const id = f.slice('fiestas/'.length, -'.json'.length);
      return copia(mocks.fiestas.get(id) ?? def);
    }
    return def;
  }),
  readDataConDetalle: jest.fn(async (f: string, def: any) => {
    if (f.startsWith('fiestas/') && f.endsWith('.json')) {
      const id = f.slice('fiestas/'.length, -'.json'.length);
      return { valor: copia(mocks.fiestas.get(id) ?? def), huboFalla: false };
    }
    return { valor: def, huboFalla: false };
  }),
  writeData: jest.fn(async () => undefined),
  updateDataPartial: jest.fn(async () => true),
}));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async (id: string) => copia(mocks.fiestas.get(id) ?? null)),
  preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, fn: any) => {
    const actual = copia(mocks.fiestas.get(id));
    const next = typeof fn === 'function' ? await fn(actual) : { ...actual, ...fn };
    mocks.fiestas.set(id, copia(next));
    return { success: true, updatedFiesta: next };
  }),
}));
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: jest.fn(async () => ({ success: true })),
  mutarCostosInterno: jest.fn(async (id: string, fn: (c: any) => any) => {
    const f = mocks.fiestas.get(id);
    const next = fn(copia(f.gestionCostos || { costosItems: [] }));
    f.gestionCostos = next;
    return { success: true, updatedData: next };
  }),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async (id: string) => copia(mocks.presupuestos.get(id) ?? null)),
  getPresupuestos: jest.fn(async () => []),
}));
jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => copia(mocks.roles)),
}));
jest.mock('@/app/actions/activos-fijos', () => ({
  getActivosFijos: jest.fn(async () => []),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(async () => []),
}));
jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn(async () => []),
}));
jest.mock('@/app/actions/insumos', () => ({
  getInsumos: jest.fn(async () => []),
}));

import { syncFiestaFromBudget } from '@/app/actions/fiesta/fiesta.actions';
import { syncAllEventCosts } from '@/app/actions/fiesta/costos.actions';
import { calcularCostoIngredienteEnReceta, unidadesQueNoSePuedenConvertir } from '@/lib/catering/unidades';
import { consolidarCompras } from '@/lib/compras/consolidar-compras';

describe('Orden 368 B5 — Las bebidas no se confunden con equipos y cuentas de comida', () => {
  beforeEach(() => {
    mocks.fiestas.clear();
    mocks.presupuestos.clear();
  });

  it('BARRA DJ y CANASTAS PANERAS MARRONES no entran a bebidas al sincronizar el presupuesto', async () => {
    mocks.fiestas.set('f1', {
      id: 'f1',
      presupuestoId: 'p1',
      configuracion: { nombreEvento: 'Fiesta Test', invitadosEstimados: 100 },
      modulosContratados: {},
      personalAsignado: [],
      gestionCostos: { costosItems: [] },
    });
    mocks.presupuestos.set('p1', {
      id: 'p1',
      eventoTipo: 'Cumpleaños',
      clienteNombre: 'Ana',
      invitadosCantidad: 100,
      invitadosAdultos: 100,
      invitadosNinos: 0,
      invitadosAdolescentes: 0,
      costoTotalEstimado: 100000,
      itemsPresupuestados: [
        {
          idServicioCatalogo: 'lc_barradj',
          nombreServicio: 'BARRA DJ',
          categoriaServicio: 'Discoteca',
          cantidad: 1,
          precioUnitario: 8000,
          costoTotalItem: 8000,
        },
        {
          idServicioCatalogo: 'lc_paneras',
          nombreServicio: 'CANASTAS PANERAS MARRONES',
          categoriaServicio: 'Vajilla (Activo)',
          cantidad: 9,
          precioUnitario: 100,
          costoTotalItem: 900,
        },
        {
          idServicioCatalogo: 'beb_1',
          nombreServicio: 'Barra de tragos clásica',
          categoriaServicio: 'Servicio de bebidas',
          cantidad: 1,
          precioUnitario: 20000,
          costoTotalItem: 20000,
        },
      ],
    });

    const res = await syncFiestaFromBudget('f1');
    expect(res.success).toBe(true);

    const fiesta = mocks.fiestas.get('f1');
    const todosLosItemsBebida = (fiesta.bebidas?.categorias || []).flatMap((c: any) => c.items || []);
    const nombres = todosLosItemsBebida.map((i: any) => i.nombre);

    expect(nombres).not.toContain('BARRA DJ');
    expect(nombres).not.toContain('CANASTAS PANERAS MARRONES');
    expect(nombres).toContain('Barra de tragos clásica');
  });

  it('repostería con cantidad 0 cuesta $0 en syncAllEventCosts', async () => {
    mocks.fiestas.set('f2', {
      id: 'f2',
      presupuestoId: 'p2',
      configuracion: { nombreEvento: 'Fiesta Repostería', invitadosEstimados: 50 },
      personalAsignado: [],
      reposteria: {
        categorias: [
          {
            id: 'mesa_postres',
            nombreDisplay: 'Mesa de Postres',
            activada: true,
            items: [
              { id: 'rep_0', nombre: 'Torta sin pedir', cantidad: 0, costoEstimado: 5000 },
              { id: 'rep_2', nombre: 'Torta principal', cantidad: 2, costoEstimado: 3000 },
            ],
          },
        ],
      },
      gestionCostos: { costosItems: [] },
    });
    mocks.presupuestos.set('p2', {
      id: 'p2',
      invitadosAdultos: 50,
      invitadosAdolescentes: 0,
      invitadosNinos: 0,
      costoTotalEstimado: 50000,
      itemsPresupuestados: [],
    });

    const res = await syncAllEventCosts('f2');
    expect(res.success).toBe(true);
    expect(mocks.fiestas.get('f2').gestionCostos.others.totalReposteriaCost).toBe(6000);
  });

  it('2 huevos en Unidad con catálogo Docena a $180 para 50 invitados cuestan $1.500 y lo no convertible da $0 con aviso', () => {
    const porPersona = calcularCostoIngredienteEnReceta(2, 180, 'Unidad', 'Docena');
    expect(porPersona).toBeCloseTo(30, 6);
    expect(porPersona * 50).toBeCloseTo(1500, 6);
    expect(
      unidadesQueNoSePuedenConvertir(
        { name: 'Huevos', unit: 'Unidad', origenId: 'ing_huevo' },
        [{ id: 'ing_huevo', nombre: 'Huevos', unidad: 'Docena' } as any],
      ),
    ).toBeNull();

    const costoIncompatible = calcularCostoIngredienteEnReceta(2, 100, 'Tazas', 'Gramos');
    expect(costoIncompatible).toBe(0);
    const aviso = unidadesQueNoSePuedenConvertir(
      { name: 'Harina', unit: 'Tazas', origenId: 'ing_harina' },
      [{ id: 'ing_harina', nombre: 'Harina', unidad: 'Gramos' } as any],
    );
    expect(aviso).toContain('Harina');
  });

  it('consolidarCompras avisa cuando el stock no se puede convertir a la unidad de la receta', () => {
    const avisosConversion: string[] = [];
    const resultado = consolidarCompras(
      [
        {
          nombre: 'Ron Blanco',
          cantidadNecesaria: 500,
          unit: 'ml',
          costoUnitario: 1000,
          unidadCosto: 'l',
          proveedor: 'Distribuidora',
          origen: 'Barra',
          stockDisponible: 4,
          unidadStock: 'Botella',
        },
      ],
      { redondeo: 'arriba', avisosConversion },
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0].stockInconvertibleAviso).toMatch(/Ron Blanco/);
    expect(resultado[0].stockInconvertibleAviso).toMatch(/4 Botella/);
    expect(avisosConversion).toHaveLength(1);
  });
});
