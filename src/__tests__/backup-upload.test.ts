jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    _body: any;
    status: number;

    constructor(body: any, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }

    async json() {
      return JSON.parse(typeof this._body === 'string' ? this._body : String(this._body));
    }

    static json(data: any, init?: { status?: number }) {
      return new MockNextResponse(JSON.stringify(data), { status: init?.status ?? 200 });
    }
  },
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));

import { readData, writeData } from '@/lib/data-service';
import JSZip from 'jszip';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;

function makeSafeBudget(id: string) {
  return {
    id,
    clienteNombre: 'Cliente',
    eventoTipo: 'Cumpleanos',
    eventoFecha: '2026-08-08T03:00:00.000Z',
    salonFiestas: 'Salon confirmado',
    invitadosCantidad: 50,
    itemsPresupuestados: [{
      idServicioCatalogo: 'serv_discoteca',
      nombreServicio: 'Discoteca',
      cantidad: 1,
      costoTotalItem: 10000,
    }],
    costoTotalEstimado: 10000,
    totalConDescuento: 10000,
  };
}

function makeFile(name: string, type: string, content: Buffer | string) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return {
    name,
    type,
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  } as File;
}

function makeRequest(file: File) {
  return {
    formData: async () => ({
      get: (key: string) => (key === 'backupFile' ? file : null),
    }),
  } as unknown as Request;
}

describe('backup upload route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadData.mockResolvedValue([]);
    mockWriteData.mockResolvedValue(undefined);
  });

  it('restaura costos y recibos sin generar respaldos intermedios ni perder IDs', async () => {
    const zip = new JSZip();
    const libro = [{ id: 'hash', porcentaje: 10, ids: ['i1'], terminado: true }];
    zip.file('insumos.json', JSON.stringify([{ id: 'i1', valorUnitarioEstimado: 110 }]));
    zip.file('ajustes-costos-insumos.json', JSON.stringify(libro));
    const { POST } = await import('@/app/api/backup/upload/route');
    const body = await (await POST(makeRequest(makeFile('costos.zip', 'application/zip', await zip.generateAsync({ type: 'nodebuffer' }))))).json();
    expect(body.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalledWith('ajustes-costos-insumos.json', libro, undefined, { skipAutoBackup: true, esRestauracion: true });
  });

  it('un ZIP viejo de insumos descarta el libro posterior, pero un ZIP de clientes no', async () => {
    const { POST } = await import('@/app/api/backup/upload/route');
    for (const file of ['customers.json', 'insumos.json']) {
      mockWriteData.mockClear();
      const zip = new JSZip();
      zip.file(file, JSON.stringify([{ id: 'i1' }]));
      expect((await (await POST(makeRequest(makeFile('legacy.zip', 'application/zip', await zip.generateAsync({ type: 'nodebuffer' }))))).json()).success).toBe(true);
      const clears = mockWriteData.mock.calls.filter(call => call[0] === 'ajustes-costos-insumos.json');
      expect(clears).toHaveLength(file === 'insumos.json' ? 1 : 0);
    }
  });

  it('si el libro no se puede restaurar, el ZIP no se anuncia completo', async () => {
    const zip = new JSZip();
    zip.file('insumos.json', '[{"id":"i1"}]');
    mockWriteData.mockImplementation(async (file) => { if (file === 'ajustes-costos-insumos.json') throw new Error('offline'); });
    const { POST } = await import('@/app/api/backup/upload/route');
    const body = await (await POST(makeRequest(makeFile('legacy.zip', 'application/zip', await zip.generateAsync({ type: 'nodebuffer' }))))).json();
    expect(body.completo).toBe(false);
    expect(body.errors).toContain('ajustes-costos-insumos.json');
  });

  it('imports confirmed events JSON without replacing the services catalog', async () => {
    const bundle = {
      customers: [{ id: 'cust_1', name: 'Cliente' }],
      presupuestos: [makeSafeBudget('pres_1')],
      fiestas: [{ id: 'fiesta_1', presupuestoId: 'pres_1', configuracion: { clienteNombre: 'Cliente' } }],
      serviciosEmpresa: [{ id: 'bad_service', nombre: 'No deberia importarse', categoria: 'Historico' }],
      serviciosCreados: [{ id: 'bad_created', nombre: 'Tampoco' }],
    };

    const { POST } = await import('@/app/api/backup/upload/route');
    const response = await POST(makeRequest(makeFile('ak-importacion.json', 'application/json', JSON.stringify(bundle))));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({ customers: 1, presupuestos: 1, fiestas: 1 });
    expect(body.skipped).toContain('servicios-empresa.json');
    expect(mockWriteData).toHaveBeenCalledWith('customers.json', bundle.customers);
    expect(mockWriteData).toHaveBeenCalledWith('presupuestos.json', bundle.presupuestos);
    expect(mockWriteData).toHaveBeenCalledWith('fiestas/fiesta_1.json', bundle.fiestas[0]);
    expect(mockWriteData).not.toHaveBeenCalledWith('servicios-empresa.json', expect.anything(), expect.anything());
  });

  it('upserts only explicit compatibility services', async () => {
    mockReadData.mockResolvedValue([{ id: 'serv_existente', nombre: 'Discoteca basica', categoria: 'Servicio de discoteca' }]);
    const bundle = {
      customers: [],
      presupuestos: [makeSafeBudget('pres_1')],
      serviciosEmpresaUpsert: [
        { id: 'serv_existente', nombre: 'Discoteca basica', categoria: 'Servicio de discoteca' },
        { id: 'serv_discoteca_intermedia', nombre: 'Discoteca intermedia', categoria: 'Servicio de discoteca' },
      ],
    };

    const { POST } = await import('@/app/api/backup/upload/route');
    const response = await POST(makeRequest(makeFile('ak-importacion.json', 'application/json', JSON.stringify(bundle))));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.serviciosEmpresaAgregados).toBe(1);
    expect(mockWriteData).toHaveBeenCalledWith(
      'servicios-empresa.json',
      expect.arrayContaining([expect.objectContaining({ id: 'serv_discoteca_intermedia' })]),
      expect.any(Function),
    );
  });
});
