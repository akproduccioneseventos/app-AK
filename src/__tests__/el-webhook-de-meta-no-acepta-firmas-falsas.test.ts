/** @jest-environment node */

import crypto from 'crypto';
import { NextRequest } from 'next/server';

let mockDmsStore: any[] = [];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'social-mensajes-directos.json') return mockDmsStore;
    return fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'social-mensajes-directos.json') mockDmsStore = data;
  }),
}));

import { POST } from '@/app/api/meta/webhook/route';

describe('El webhook de Meta no acepta firmas falsas', () => {
  const secret = 'meta_ak_secret';

  beforeEach(() => {
    mockDmsStore = [];
    process.env.META_APP_SECRET = secret;
  });

  function generarFirma(cuerpo: string): string {
    const hmac = crypto.createHmac('sha256', secret).update(cuerpo).digest('hex');
    return `sha256=${hmac}`;
  }

  it('con una firma falsa, no se guarda nada y devuelve 403', async () => {
    const bodyStr = JSON.stringify({
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_1',
          messaging: [
            {
              sender: { id: 'user_1' },
              recipient: { id: 'page_1' },
              message: { mid: 'mid_falso_1', text: 'Mensaje no autorizado' },
            },
          ],
        },
      ],
    });

    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': 'sha256=firma_totalmente_falsa_99999999999999999999999999999999',
      },
      body: bodyStr,
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockDmsStore.length).toBe(0);
  });

  it('el mismo mid dos veces guarda solo uno (deduplicación)', async () => {
    const bodyStr = JSON.stringify({
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_1',
          messaging: [
            {
              sender: { id: 'user_valido' },
              recipient: { id: 'page_1' },
              message: { mid: 'mid_unico_123', text: 'Hola, consulta por fiesta' },
            },
          ],
        },
      ],
    });

    const firmaValida = generarFirma(bodyStr);

    // Primer envío
    const req1 = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': firmaValida,
      },
      body: bodyStr,
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    expect(mockDmsStore.length).toBe(1);
    expect(mockDmsStore[0].mid).toBe('mid_unico_123');

    // Segundo envío con el mismo mid
    const req2 = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': firmaValida,
      },
      body: bodyStr,
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    // Sigue habiendo un solo mensaje guardado
    expect(mockDmsStore.length).toBe(1);
  });
});
