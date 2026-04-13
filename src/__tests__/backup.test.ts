/**
 * Tests for backup download API route.
 *
 * We mock readData/writeData to test the route logic in isolation.
 */

// Must mock next/server before importing the route
class MockHeaders {
  private _map = new Map<string, string>();
  set(key: string, value: string) { this._map.set(key.toLowerCase(), value); }
  get(key: string) { return this._map.get(key.toLowerCase()) ?? null; }
  forEach(cb: (value: string, key: string) => void) { this._map.forEach(cb); }
}

jest.mock('next/server', () => {
  class MockNextResponse {
    _body: any;
    status: number;
    headers: MockHeaders;
    constructor(body: any, init?: { status?: number; headers?: any }) {
      this._body = body;
      this.status = init?.status ?? 200;
      this.headers = new MockHeaders();
      if (init?.headers) {
        if (typeof init.headers.forEach === 'function') {
          init.headers.forEach((value: string, key: string) => {
            this.headers.set(key, value);
          });
        }
      }
    }
    async arrayBuffer() {
      if (Buffer.isBuffer(this._body)) {
        // Create a new ArrayBuffer from the Buffer data
        const buf = this._body;
        const ab = new ArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; i++) view[i] = buf[i];
        return ab;
      }
      const str = typeof this._body === 'string' ? this._body : String(this._body);
      const buf = Buffer.from(str);
      const ab = new ArrayBuffer(buf.length);
      const view = new Uint8Array(ab);
      for (let i = 0; i < buf.length; i++) view[i] = buf[i];
      return ab;
    }
    async json() {
      return JSON.parse(typeof this._body === 'string' ? this._body : String(this._body));
    }
    static json(data: any, init?: { status?: number }) {
      return new MockNextResponse(JSON.stringify(data), { status: init?.status ?? 200 });
    }
  }
  return { NextResponse: MockNextResponse };
});

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

import JSZip from 'jszip';
import { readData } from '@/lib/data-service';

const mockReadData = readData as jest.MockedFunction<typeof readData>;

describe('Backup download route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadData.mockResolvedValue([]);
  });

  it('generates a ZIP with metadata', async () => {
    mockReadData.mockImplementation(async (file: string, defaultVal: any) => {
      if (file === 'presupuestos.json') return [{ id: '1', clienteNombre: 'Test' }];
      if (file === 'customers.json') return [{ id: 'c1', name: 'María' }];
      return defaultVal;
    });

    const { GET } = await import('@/app/api/backup/download/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Should contain metadata
    const metadataFile = zip.file('_metadata.json');
    expect(metadataFile).not.toBeNull();

    const metadataContent = JSON.parse(await metadataFile!.async('string'));
    expect(metadataContent.source).toBe('firestore');
    expect(metadataContent.version).toBe('1.0');
    expect(metadataContent.exportedAt).toBeDefined();

    // Should contain data files
    const presupuestosFile = zip.file('presupuestos.json');
    expect(presupuestosFile).not.toBeNull();
    const presupuestosData = JSON.parse(await presupuestosFile!.async('string'));
    expect(presupuestosData).toEqual([{ id: '1', clienteNombre: 'Test' }]);
  });

  it('exports all collections even when empty', async () => {
    mockReadData.mockResolvedValue([]);

    const { GET } = await import('@/app/api/backup/download/route');
    const response = await GET();

    expect(response.status).toBe(200);

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Should contain metadata + data files
    const files = Object.keys(zip.files);
    expect(files).toContain('_metadata.json');
    expect(files).toContain('presupuestos.json');
    expect(files).toContain('customers.json');
  });
});
