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

import { readData, writeData } from '@/lib/data-service';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;

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
  });

  it('imports confirmed events JSON without replacing the services catalog', async () => {
    const bundle = {
      customers: [{ id: 'cust_1', name: 'Cliente' }],
      presupuestos: [{ id: 'pres_1', clienteNombre: 'Cliente', itemsPresupuestados: [] }],
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
      presupuestos: [{ id: 'pres_1', clienteNombre: 'Cliente', itemsPresupuestados: [] }],
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
