/** @jest-environment node */

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
  getCrmStages: jest.fn().mockResolvedValue([]),
  moveCrmLead: jest.fn(),
}));

jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn(),
}));

jest.mock('@/lib/firebase-sync', () => ({
  isFirebaseAvailable: jest.fn().mockReturnValue(false),
  forceDeleteDocFromFirestore: jest.fn(),
  forceDeleteCollectionFromFirestore: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const almacen: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return {
      valor: guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado)),
      huboFalla: false,
    };
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = JSON.parse(JSON.stringify(datos));
  }),
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    const lista = almacen[archivo] || [];
    if (lista.some((x: any) => x.id === id)) throw new Error('ALREADY_EXISTS');
    lista.push(JSON.parse(JSON.stringify(item)));
    almacen[archivo] = lista;
  }),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (x: any) => any) => {
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return null;
    const nuevo = cambiar(JSON.parse(JSON.stringify(lista[indice])));
    if (!nuevo) return null;
    lista[indice] = JSON.parse(JSON.stringify(nuevo));
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

let shouldFailSaveInvoice = false;

jest.mock('@/app/actions/invoices', () => {
  const actual = jest.requireActual('@/app/actions/invoices');
  return {
    ...actual,
    saveInvoice: jest.fn(async (...args: any[]) => {
      if (shouldFailSaveInvoice) {
        throw new Error('Fallo de red simulado al guardar factura');
      }
      return actual.saveInvoice(...args);
    }),
  };
});

import { processHistoricRecord } from '@/app/actions/historicos';

describe('Carga histórica no duplica por idIntento', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  beforeEach(() => {
    for (const key of Object.keys(almacen)) {
      delete almacen[key];
    }
    shouldFailSaveInvoice = false;
  });

  const createValidFormData = (idIntento: string) => {
    const fd = new FormData();
    fd.append('idIntento', idIntento);
    fd.append('clienteNombre', 'Cliente Prueba');
    fd.append('eventoFecha', '2025-10-15T00:00:00.000Z');
    fd.append('montoTotal', '50000');
    const file = new File(['dummy-contract-content'], 'contrato.pdf', { type: 'application/pdf' });
    fd.append('contractFile', file);
    return fd;
  };

  test('a) Enviar 2 llamadas a processHistoricRecord con el mismo idIntento deja exactamente 1 presupuesto, 1 cliente y 1 factura (no duplica cobros ni facturas)', async () => {
    const idIntento = 'intento-1111-2222-3333-4444';
    const fd1 = createValidFormData(idIntento);
    const fd2 = createValidFormData(idIntento);

    const res1 = await processHistoricRecord(fd1);
    expect(res1.success).toBe(true);

    const res2 = await processHistoricRecord(fd2);
    expect(res2.success).toBe(true);

    const clientes = almacen['customers.json'] || [];
    const presupuestos = almacen['presupuestos.json'] || [];
    const facturas = almacen['invoices.json'] || [];

    expect(clientes).toHaveLength(1);
    expect(presupuestos).toHaveLength(1);
    expect(facturas).toHaveLength(1);

    // Verificar que no se duplicaron los cobros en el presupuesto
    expect(presupuestos[0].pagosCliente).toHaveLength(1);
    expect(presupuestos[0].pagosCliente[0].monto).toBe(50000);

    // Verificar que no se duplicaron los pagos en la factura
    expect(facturas[0].payments).toHaveLength(1);
    expect(facturas[0].payments[0].amount).toBe(50000);
  });

  test('b) Si una primera llamada falló a mitad de camino (simulando error al crear factura), una segunda llamada con el mismo idIntento retoma y completa sin duplicar el cliente ni el presupuesto ya creados', async () => {
    const idIntento = 'intento-fallo-mitad-de-camino-1234';
    const fd1 = createValidFormData(idIntento);
    const fd2 = createValidFormData(idIntento);

    // Activar fallo simulado en saveInvoice durante la primera llamada
    shouldFailSaveInvoice = true;

    const res1 = await processHistoricRecord(fd1);
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('Fallo de red simulado al guardar factura');

    // Estado intermedio: el cliente y el presupuesto se crearon, pero la factura no
    expect(almacen['customers.json']).toHaveLength(1);
    expect(almacen['presupuestos.json']).toHaveLength(1);
    expect(almacen['invoices.json'] || []).toHaveLength(0);

    // Desactivar fallo para la segunda llamada con el mismo idIntento
    shouldFailSaveInvoice = false;

    const res2 = await processHistoricRecord(fd2);
    expect(res2.success).toBe(true);

    // Estado final: sigue habiendo 1 solo cliente y 1 solo presupuesto, y ahora hay 1 factura
    expect(almacen['customers.json']).toHaveLength(1);
    expect(almacen['presupuestos.json']).toHaveLength(1);
    expect(almacen['invoices.json']).toHaveLength(1);

    // Sin duplicación de cobros ni facturas
    expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(1);
    expect(almacen['invoices.json'][0].payments).toHaveLength(1);
  });

  test('c) Validación de archivo en servidor: tamaño mayor a 10MB falla y no crea registros', async () => {
    const idIntento = 'intento-archivo-pesado-9999';
    const fd = new FormData();
    fd.append('idIntento', idIntento);
    fd.append('clienteNombre', 'Cliente Pesado');
    fd.append('eventoFecha', '2025-10-15T00:00:00.000Z');
    fd.append('montoTotal', '50000');
    // Archivo de 11 MB
    const fakeFile = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(fakeFile, 'size', { value: 11 * 1024 * 1024 });
    fd.append('contractFile', fakeFile);

    const res = await processHistoricRecord(fd);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/10\s*MB/i);
    expect(almacen['customers.json'] || []).toHaveLength(0);
    expect(almacen['presupuestos.json'] || []).toHaveLength(0);
  });

  test('d) Validación de archivo en servidor: tipo no permitido falla y no crea registros', async () => {
    const idIntento = 'intento-archivo-invalido-8888';
    const fd = new FormData();
    fd.append('idIntento', idIntento);
    fd.append('clienteNombre', 'Cliente Invalido');
    fd.append('eventoFecha', '2025-10-15T00:00:00.000Z');
    fd.append('montoTotal', '50000');
    const fakeFile = new File(['binary content'], 'script.exe', { type: 'application/x-msdownload' });
    fd.append('contractFile', fakeFile);

    const res = await processHistoricRecord(fd);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/PDF|imagen/i);
    expect(almacen['customers.json'] || []).toHaveLength(0);
    expect(almacen['presupuestos.json'] || []).toHaveLength(0);
  });
});
