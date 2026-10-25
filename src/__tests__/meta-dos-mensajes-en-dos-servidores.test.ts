/** @jest-environment node */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

describe('Meta Webhook - Dos mensajes en dos servidores', () => {
  const storeGlobal = new Map<string, any[]>();
  const secret = 'meta-test-secret-123';

  beforeEach(() => {
    process.env.META_APP_SECRET = secret;
    storeGlobal.clear();
    storeGlobal.set('social-mensajes-directos.json', []);
  });

  afterEach(() => {
    delete process.env.META_APP_SECRET;
  });

  function firmar(bodyStr: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(bodyStr).digest('hex')}`;
  }

  test('dos mensajes con mid distintos en dos servidores concurrentes quedan ambos guardados', async () => {
    let postModulo1: any;
    let postModulo2: any;

    const mockMutate = async (filePath: string, cambiar: (lista: any[]) => any[] | null) => {
      // Simula transacción: relee copia actual, aplica cambiar, guarda copia
      const actual = JSON.parse(JSON.stringify(storeGlobal.get(filePath) || []));
      const nueva = cambiar(actual);
      if (nueva !== null) {
        storeGlobal.set(filePath, JSON.parse(JSON.stringify(nueva)));
      }
      return nueva;
    };

    jest.isolateModules(() => {
      jest.doMock('@/lib/generic-json-store', () => ({
        mutateGenericJsonArray: jest.fn(mockMutate),
      }));

      const route1 = require('@/app/api/meta/webhook/route');
      postModulo1 = route1.POST;
    });

    jest.isolateModules(() => {
      jest.doMock('@/lib/generic-json-store', () => ({
        mutateGenericJsonArray: jest.fn(mockMutate),
      }));

      const route2 = require('@/app/api/meta/webhook/route');
      postModulo2 = route2.POST;
    });

    expect(postModulo1).toBeDefined();
    expect(postModulo2).toBeDefined();

    const payload1 = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'user_1' },
              recipient: { id: 'ak_ig' },
              message: { mid: 'mid_instagram_001', text: 'Hola quiero presupuesto' },
              timestamp: 1700000000000,
            },
          ],
        },
      ],
    };

    const payload2 = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'user_2' },
              recipient: { id: 'ak_ig' },
              message: { mid: 'mid_instagram_002', text: 'Tienen fecha para noviembre?' },
              timestamp: 1700000001000,
            },
          ],
        },
      ],
    };

    const bodyStr1 = JSON.stringify(payload1);
    const bodyStr2 = JSON.stringify(payload2);

    const req1 = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': firmar(bodyStr1),
      },
      body: bodyStr1,
    });

    const req2 = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': firmar(bodyStr2),
      },
      body: bodyStr2,
    });

    const [res1, res2] = await Promise.all([
      postModulo1(req1),
      postModulo2(req2),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const data1 = await res1.json();
    const data2 = await res2.json();
    expect(data1.status).toBe('EVENT_RECEIVED');
    expect(data2.status).toBe('EVENT_RECEIVED');

    const guardados = storeGlobal.get('social-mensajes-directos.json') || [];
    // Ambos mensajes deben quedar guardados en el archivo sin que ninguno pise al otro
    expect(guardados).toHaveLength(2);
    const mids = guardados.map((m: any) => m.mid);
    expect(mids).toContain('mid_instagram_001');
    expect(mids).toContain('mid_instagram_002');
  });
});
