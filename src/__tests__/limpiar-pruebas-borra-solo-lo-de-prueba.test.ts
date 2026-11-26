const mockDb: Record<string, any> = {};
const deletedCalls: Array<{ file: string; col: string; id: string }> = [];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { id: 'u1', perfil: 'dueno' } }),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  esSesionDeAuditor: jest.fn().mockResolvedValue(false),
  esSesionDeSoloLectura: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    const val = mockDb[file];
    return val === undefined ? JSON.parse(JSON.stringify(def)) : JSON.parse(JSON.stringify(val));
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    mockDb[file] = JSON.parse(JSON.stringify(data));
  }),
  deleteDataItem: jest.fn(async (file: string, col: string, id: string) => {
    deletedCalls.push({ file, col, id });
    if (Array.isArray(mockDb[file])) {
      mockDb[file] = mockDb[file].filter((x: any) => x.id !== id);
    }
    return true;
  }),
}));

import { correrLimpiezaDePruebas } from '@/lib/automatico/limpiar-pruebas';

describe('Orden 355 Bloque 10: limpiar-pruebas borra sólo registros de prueba sin cobros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deletedCalls.length = 0;
    for (const k of Object.keys(mockDb)) delete mockDb[k];

    mockDb['salones.json'] = [
      { id: 'sal_prueba', nombre: 'PRUEBA Salón Fiesta' },
      { id: 'sal_real', nombre: 'Pruebas de sonido Salón Arapey' },
    ];
    mockDb['crm-leads.json'] = [
      { id: 'lead_prueba', name: 'Prueba Test' },
      { id: 'lead_real', name: 'María Fernández' },
    ];
    mockDb['presupuestos.json'] = [
      {
        id: 'pres_con_cobro',
        clienteNombre: 'PRUEBA Con Cobro',
        pagosCliente: [{ id: 'pag1', monto: 5000, estadoPago: 'confirmado' }],
      },
      {
        id: 'pres_vacio',
        clienteNombre: 'Cliente Prueba',
        pagosCliente: [],
      },
    ];
    mockDb['fiestas.json'] = [];
    mockDb['invoices.json'] = [];
  });

  it('borra "PRUEBA Salón..." y "Prueba Test", respeta "Pruebas de sonido Salón Arapey" y presupuesto con cobro, y en la 2da corrida no hace nada', async () => {
    const r1 = await correrLimpiezaDePruebas({ ahora: new Date('2026-11-26T10:00:00.000Z') });
    expect(r1.ejecutada).toBe(true);
    expect(deletedCalls.map((c) => c.id).sort()).toEqual(['lead_prueba', 'pres_vacio', 'sal_prueba']);
    expect(mockDb['salones.json'].map((s: any) => s.id)).toEqual(['sal_real']);
    expect(mockDb['presupuestos.json'].map((p: any) => p.id)).toEqual(['pres_con_cobro']);
    expect(r1.noBorrados).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'pres_con_cobro' })])
    );
    expect(mockDb['limpiar-pruebas-copia.json']?.registros).toHaveLength(3);

    // Segunda corrida no borra nada
    const r2 = await correrLimpiezaDePruebas({ ahora: new Date('2026-11-26T11:00:00.000Z') });
    expect(r2.ejecutada).toBe(false);
    expect(r2.omitido).toBe('ya_corrio');
    expect(deletedCalls).toHaveLength(3);
  });
});
