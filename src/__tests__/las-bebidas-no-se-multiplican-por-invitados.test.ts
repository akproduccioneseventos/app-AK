const mutarCostosMock = jest.fn(async (_id: string, cb: (c: any) => any) => {
  const res = cb({ costosItems: [] });
  return { success: true, costos: res };
});

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'dueno' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn().mockResolvedValue({ id: 'f_beb_364' }),
}));
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: jest.fn().mockResolvedValue({ success: true }),
  mutarCostosInterno: (...args: any[]) => mutarCostosMock(...args),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({
    id: 'f_beb_364',
    presupuestoId: 'pres_beb_364',
    configuracion: { nombreEvento: 'Fiesta 100', fechaEvento: '2026-12-10', invitadosEstimados: 100 },
    bebidas: {
      categorias: [
        {
          id: 'cat_1',
          nombre: 'Vinos',
          activada: true,
          items: [{ id: 'b1', nombre: 'Vino Tinto', costoUnitario: 300, cantidadNecesaria: 40 }],
        },
      ],
    },
  })),
  saveFiesta: jest.fn(),
  updateFiestaPartial: jest.fn(),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => ({
    id: 'pres_beb_364',
    invitadosAdultos: 100,
    invitadosNinos: 0,
    invitadosCantidad: 100,
    itemsPresupuestados: [],
    totalConDescuento: 50000,
    pagosCliente: [],
  })),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/app/actions/insumos', () => ({
  getInsumos: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn().mockResolvedValue([]),
}));

import { syncAllEventCosts } from '@/app/actions/fiesta/costos.actions';

describe('Orden 364: las bebidas no se multiplican por invitados en contabilidad', () => {
  it('40 botellas a $300 con 100 invitados cargan $12.600 (con merma 5%) y no $1.200.000', async () => {
    const res = await syncAllEventCosts('f_beb_364');
    expect(res.success).toBe(true);
    const guardados = mutarCostosMock.mock.results[0].value;
    const { costos } = await guardados;
    expect(costos.others?.totalBebidasCost).toBe(12600);
    const mermaItem = costos.costosItems.find((it: any) => it.id === 'auto_merma_bebidas');
    expect(mermaItem?.montoEstimado).toBe(600);
  });
});
