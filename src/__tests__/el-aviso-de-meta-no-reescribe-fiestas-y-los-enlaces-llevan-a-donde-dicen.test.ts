/** @jest-environment node */
// Revisión de la 1451 (20/11/2026): el aviso de una mención en una historia reescribía fiestas.json
// entero (pisaba cobros guardados al mismo tiempo), y en /enlaces el botón de WhatsApp llevaba a una
// ruta que no existe y la cuenta de clics guardaba cualquier nombre mandado desde afuera.
import fs from 'fs';
import path from 'path';

const guardados: any[] = [];
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (_archivo: string, fn: (l: any[]) => any) => {
    const r = fn(JSON.parse(JSON.stringify(guardados)));
    if (Array.isArray(r)) guardados.splice(0, guardados.length, ...r);
  }),
  readGenericJsonFile: jest.fn(async () => JSON.parse(JSON.stringify(guardados))),
}));

import { GET } from '@/app/api/enlaces/clic/route';

describe('el aviso de Meta y la página de enlaces', () => {
  beforeEach(() => guardados.splice(0, guardados.length));

  it('el aviso de Meta no escribe la lista de fiestas', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/meta/webhook/route.ts'), 'utf8');
    expect(src).not.toMatch(/['"]fiestas\.json['"]/);
  });

  it('el botón de WhatsApp lleva al WhatsApp de verdad con la marca de origen', async () => {
    const res = await GET(new Request('http://localhost:3000/api/enlaces/clic?d=whatsapp'));
    const destino = res.headers.get('location') || '';
    expect(destino).toMatch(/^https:\/\/wa\.me\//);
    expect(decodeURIComponent(destino)).toContain('ref AK-bio');
    expect(guardados).toEqual([expect.objectContaining({ boton: 'whatsapp', clicks: 1 })]);
  });

  it('un botón inventado no se guarda y vuelve a la página de enlaces', async () => {
    const res = await GET(new Request('http://localhost:3000/api/enlaces/clic?d=cualquier-cosa'));
    expect(res.headers.get('location')).toBe('http://localhost:3000/enlaces');
    expect(guardados).toEqual([]);
  });

  it('redes lleva al Instagram de AK, no a la portada de Instagram', async () => {
    const res = await GET(new Request('http://localhost:3000/api/enlaces/clic?d=redes'));
    expect(res.headers.get('location')).toContain('instagram.com/akproduccionesfiestasyeventos');
  });
});
