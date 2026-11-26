let mockPerfil = 'operador';

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({
    success: true,
    user: { id: 'u1', email: 'equipo@ak.uy', perfil: mockPerfil },
  })),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    if (file === 'asistente-propuestas.json') {
      return [
        {
          id: 'prop_cobro_1',
          clave: 'cobro:whatsapp:1',
          area: 'cobros',
          tipoPropuesta: 'registrar_cobro',
          titulo: 'Cobro recibido $25.000 de Camila',
          quePasa: 'Llegó comprobante por WhatsApp',
          porQueImporta: 'Plata',
          quePropone: 'Anotar cobro',
          estado: 'pendiente',
          createdAt: '2026-11-26T08:00:00.000Z',
          updatedAt: '2026-11-26T08:00:00.000Z',
        },
        {
          id: 'prop_insumos_1',
          clave: 'stock:1',
          area: 'fiestas',
          tipoPropuesta: 'reponer_insumo',
          titulo: 'Comprar servilletas',
          quePasa: 'Faltan servilletas',
          porQueImporta: 'Stock',
          quePropone: 'Reponer',
          estado: 'pendiente',
          createdAt: '2026-11-26T08:00:00.000Z',
          updatedAt: '2026-11-26T08:00:00.000Z',
        },
      ];
    }
    return def;
  }),
  writeData: jest.fn(),
}));

import { getBandejaAsistenteAction } from '@/app/actions/asistente-proactivo.actions';

describe('Orden 362: las propuestas de plata no las ve cualquiera del equipo', () => {
  it('un perfil sin CONTABILIDAD (operador) no ve propuestas de cobro o boletas sin responsable', async () => {
    mockPerfil = 'operador';
    const res: any = await getBandejaAsistenteAction();
    expect(res.success).toBe(true);
    expect(res.propuestas.map((p: any) => p.id)).toEqual(['prop_insumos_1']);
  });

  it('un usuario con CONTABILIDAD (secretaria) sí ve propuestas de plata sin responsable', async () => {
    mockPerfil = 'secretaria';
    const res: any = await getBandejaAsistenteAction();
    expect(res.success).toBe(true);
    expect(res.propuestas.map((p: any) => p.id)).toEqual(['prop_cobro_1', 'prop_insumos_1']);
  });
});
