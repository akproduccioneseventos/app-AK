jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
  requirePermisoAlguno: jest.fn(),
}));
jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn().mockResolvedValue({ clubUruguayConfig: { precio: 18000 } }),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [
    {
      id: 'serv_1',
      nombre: 'DJ Full',
      tipoItem: 'Servicio',
      categoria: 'Servicio de discoteca',
      precioVenta: 25000,
      valorUnitarioEstimado: 12000,
      proveedor: 'Proveedor Secreto SRL',
      notas: 'Costo negociado interno',
      cantidadDisponible: 3,
      contactoPrincipal: '099999000',
      mantenimiento: { cadaDias: 30, historial: [{ fecha: '2026-10-01', nota: 'Cambio lámpara', costo: 4000, gastoPendiente: true }] },
      estadoPublicacion: 'publicado',
    },
  ]),
  writeData: jest.fn(),
  createDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
}));

import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';

describe('Orden 361: getServiciosEmpresaPublicos no manda datos internos', () => {
  it('excluye mantenimiento, cantidadDisponible, contactoPrincipal, proveedor y notas', async () => {
    const res: any[] = await getServiciosEmpresaPublicos();
    expect(res).toHaveLength(1);
    expect(res[0].nombre).toBe('DJ Full');
    expect(res[0].precioVenta).toBe(25000);
    expect(res[0].valorUnitarioEstimado).toBe(0);
    expect(res[0].mantenimiento).toBeUndefined();
    expect(res[0].cantidadDisponible).toBeUndefined();
    expect(res[0].contactoPrincipal).toBeUndefined();
    expect(res[0].proveedor).toBeUndefined();
    expect(res[0].notas).toBeUndefined();
  });
});
