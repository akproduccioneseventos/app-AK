/** @jest-environment node */

const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const estado = {
  fiestas: new Map<string, any>(),
  presupuestos: new Map<string, any>(),
  roles: [
    { id: 'rol_mozo', nombre: 'Mozo', sueldoPorEvento: 2000, porcentajeAportesPatronales: 0 },
    { id: 'rol_chef', nombre: 'Chef', sueldoPorEvento: 3500, porcentajeAportesPatronales: 0 },
    { id: 'rol_ayudante', nombre: 'Ayudante de Cocina', sueldoPorEvento: 1800, porcentajeAportesPatronales: 0 },
    { id: 'rol_utilero', nombre: 'Utilero', sueldoPorEvento: 1700, porcentajeAportesPatronales: 0 },
  ],
};

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
      return copia(estado.fiestas.get(id) ?? def);
    }
    return def;
  }),
  readDataConDetalle: jest.fn(async (f: string, def: any) => {
    if (f.startsWith('fiestas/') && f.endsWith('.json')) {
      const id = f.slice('fiestas/'.length, -'.json'.length);
      return { valor: copia(estado.fiestas.get(id) ?? def), huboFalla: false };
    }
    return { valor: def, huboFalla: false };
  }),
  writeData: jest.fn(async () => undefined),
  updateDataPartial: jest.fn(async () => true),
}));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async (id: string) => copia(estado.fiestas.get(id) ?? null)),
  preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, fn: any) => {
    const actual = copia(estado.fiestas.get(id));
    const next = typeof fn === 'function' ? await fn(actual) : { ...actual, ...fn };
    estado.fiestas.set(id, copia(next));
    return { success: true, updatedFiesta: next };
  }),
}));
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: jest.fn(async () => ({ success: true })),
  mutarCostosInterno: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async (id: string) => copia(estado.presupuestos.get(id) ?? null)),
  getPresupuestos: jest.fn(async () => []),
}));
jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => copia(estado.roles)),
}));
jest.mock('@/app/actions/activos-fijos', () => ({
  getActivosFijos: jest.fn(async () => []),
}));

import { syncFiestaFromBudget } from '@/app/actions/fiesta/fiesta.actions';

describe('Orden 370 B5 — El personal sigue a los invitados y la carta de tragos respeta el tipo', () => {
  beforeEach(() => {
    estado.fiestas.clear();
    estado.presupuestos.clear();
  });

  it('con 100 invitados y una persona asignada, pasar a 150 suma 2 mozos sin tocar a la asignada', async () => {
    estado.fiestas.set('f_pers', {
      id: 'f_pers',
      presupuestoId: 'p_pers',
      configuracion: { nombreEvento: 'Cumple de Juan' },
      personalAsignado: [
        { empleadoId: 'emp_carlos', rolId: 'rol_mozo', eventSalary: 2500 },
        { empleadoId: '', rolId: 'rol_mozo', eventSalary: 2000 },
        { empleadoId: '', rolId: 'rol_mozo', eventSalary: 2000 },
        { empleadoId: '', rolId: 'rol_mozo', eventSalary: 2000 },
      ],
      gestionCostos: { costosItems: [] },
    });
    estado.presupuestos.set('p_pers', {
      id: 'p_pers',
      eventoTipo: 'Cumpleaños',
      clienteNombre: 'Juan',
      invitadosCantidad: 150,
      invitadosAdultos: 150,
      invitadosNinos: 0,
      invitadosAdolescentes: 0,
      costoTotalEstimado: 150000,
      itemsPresupuestados: [
        {
          idServicioCatalogo: 'cat_1',
          nombreServicio: 'Cena completa',
          categoriaServicio: 'Servicio de catering',
          cantidad: 150,
          precioUnitario: 1000,
          costoTotalItem: 150000,
        },
      ],
    });

    const res = await syncFiestaFromBudget('f_pers');
    expect(res.success).toBe(true);

    const fiesta = estado.fiestas.get('f_pers');
    const mozos = fiesta.personalAsignado.filter((p: any) => p.rolId === 'rol_mozo');
    expect(mozos).toHaveLength(6);
    expect(mozos.find((m: any) => m.empleadoId === 'emp_carlos')).toEqual({
      empleadoId: 'emp_carlos',
      rolId: 'rol_mozo',
      eventSalary: 2500,
    });
    expect(mozos.filter((m: any) => !m.empleadoId)).toHaveLength(5);
    expect(fiesta.cartaTragos?.numeroPrincipal).toBe('');
  });

  it('con invitadosCantidad en 0 y 40+10 invitados, se calcula para 50', async () => {
    estado.fiestas.set('f_split', {
      id: 'f_split',
      presupuestoId: 'p_split',
      configuracion: { nombreEvento: 'Cumple 50' },
      personalAsignado: [],
      gestionCostos: { costosItems: [] },
    });
    estado.presupuestos.set('p_split', {
      id: 'p_split',
      eventoTipo: 'Cumpleaños',
      clienteNombre: 'Lucía',
      invitadosCantidad: 0,
      invitadosAdultos: 40,
      invitadosNinos: 10,
      invitadosAdolescentes: 0,
      costoTotalEstimado: 50000,
      itemsPresupuestados: [
        {
          idServicioCatalogo: 'cat_1',
          nombreServicio: 'Cena',
          categoriaServicio: 'Servicio de catering',
          cantidad: 50,
          precioUnitario: 1000,
          costoTotalItem: 50000,
        },
      ],
    });

    const res = await syncFiestaFromBudget('f_split');
    expect(res.success).toBe(true);

    const fiesta = estado.fiestas.get('f_split');
    expect(fiesta.configuracion.invitadosEstimados).toBe(50);
    const mozos = fiesta.personalAsignado.filter((p: any) => p.rolId === 'rol_mozo');
    expect(mozos).toHaveLength(2);
  });
});
